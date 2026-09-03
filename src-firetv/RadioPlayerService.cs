using Android.App;
using Android.Content;
using Android.Media;
using Android.OS;

namespace RadioNermeen.FireTV;

/// <summary>
/// Foreground service that owns the <see cref="MediaPlayer"/> and keeps audio alive
/// when the user navigates away from the app (e.g. presses Home on the Fire TV remote).
///
/// Architecture
/// ────────────
///  • <see cref="MainActivity"/> binds to this service via <see cref="RadioBinder"/>
///    and delegates all playback operations here.
///  • When playback starts, the service promotes itself to a foreground service
///    (via <c>StartForeground</c>) so Android will not kill it.
///  • <see cref="StatusChanged"/> is always fired on the main thread so
///    UI observers can update views directly without <c>RunOnUiThread</c>.
/// </summary>
[Service(Name = "com.nilefusion.radionermeen.RadioPlayerService", Exported = false)]
public sealed class RadioPlayerService : Service, AudioManager.IOnAudioFocusChangeListener
{
    private const int    NotificationId = 1001;
    private const string ChannelId      = "radio_nermeen_playback";

    // ── State ─────────────────────────────────────────────────────────────────

    private MediaPlayer?  _player;
    private AudioManager? _audioManager;
    private Handler?      _mainHandler;
    private bool          _isPlaying;
    private bool          _isPreparing;
    private int           _currentIndex = -1;

    private readonly RadioBinder _binder;

    // ── Public API ────────────────────────────────────────────────────────────

    /// <summary>Fired on the main thread whenever the playback status text changes.</summary>
    public event Action<string>? StatusChanged;

    public bool IsPlaying    => _isPlaying;
    public bool IsPreparing  => _isPreparing;
    public int  CurrentIndex => _currentIndex;

    public RadioPlayerService() => _binder = new RadioBinder(this);

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    public override void OnCreate()
    {
        base.OnCreate();
        _audioManager = (AudioManager?)GetSystemService(AudioService);
        _mainHandler  = new Handler(Looper.MainLooper!);
        CreateNotificationChannel();
    }

    public override IBinder? OnBind(Intent? intent) => _binder;

    /// <summary>
    /// Return <see cref="StartCommandResult.Sticky"/> so the OS restarts the
    /// service after it is killed, keeping the session alive for long-running streams.
    /// </summary>
    public override StartCommandResult OnStartCommand(Intent? intent, StartCommandFlags flags, int startId)
        => StartCommandResult.Sticky;

    public override void OnDestroy()
    {
        ReleasePlayer();
        AbandonAudioFocus();
#pragma warning disable CA1422 // StopForeground(bool) is deprecated on API 33+ but still functional
        StopForeground(true);
#pragma warning restore CA1422
        base.OnDestroy();
    }

    // ── Playback control ──────────────────────────────────────────────────────

    /// <summary>Stop any current stream and start streaming the station at <paramref name="index"/>.</summary>
    public void PlayStation(int index)
    {
        if (index < 0 || index >= Stations.All.Length) return;

        var station   = Stations.All[index];
        _currentIndex = index;
        _isPreparing  = true;
        _isPlaying    = false;
        Post($"جارٍ التحميل… {station.Name}");

        ReleasePlayer();

        if (!RequestAudioFocus()) return;

        _player = new MediaPlayer();
        _player.SetAudioAttributes(new AudioAttributes.Builder()!
            .SetUsage(AudioUsageKind.Media)!
            .SetContentType(AudioContentType.Music)!
            .Build()!);

        // Capture so lambda closures remain valid across station switches.
        var capturedPlayer = _player;

        _player.Prepared += (_, _) =>
        {
            if (capturedPlayer != _player) return; // User already switched station.
            _isPreparing = false;
            _isPlaying   = true;
            capturedPlayer.Start();
            Post($"▶  {station.Name}");
            UpdateNotification(station.Name, playing: true);
        };

        _player.Error += (_, _) =>
        {
            if (capturedPlayer != _player) return;
            _isPreparing = false;
            _isPlaying   = false;
            Post($"تعذّر تشغيل: {station.Name}");
        };

        // Show the notification immediately — API 26+ requires StartForeground
        // to be called promptly after StartForegroundService.
        EnsureForeground(station.Name);

        // Resolve .pls playlist redirects on a background thread, then hand
        // the real stream URL to MediaPlayer.
        Task.Run(async () =>
        {
            var url = await ResolvePlsAsync(station.Stream).ConfigureAwait(false);

            if (capturedPlayer != _player) return; // Station changed during resolution.

            try
            {
                capturedPlayer.SetDataSource(url);
                capturedPlayer.PrepareAsync();
            }
            catch (Java.Lang.Exception)
            {
                _isPreparing = false;
                Post($"تعذّر تشغيل: {station.Name}");
            }
        });
    }

    /// <summary>Toggle play/pause on the current station.</summary>
    public void TogglePlayPause()
    {
        if (_player == null)
        {
            // Nothing loaded yet — start the last known (or first) station.
            if (_currentIndex >= 0) PlayStation(_currentIndex);
            return;
        }

        if (_isPreparing) return;

        var name = _currentIndex >= 0 ? Stations.All[_currentIndex].Name : "";

        if (_isPlaying)
        {
            _player.Pause();
            _isPlaying = false;
            Post($"⏸  {name}");
            UpdateNotification(name, playing: false);
        }
        else
        {
            if (!RequestAudioFocus()) return;
            _player.Start();
            _isPlaying = true;
            Post($"▶  {name}");
            UpdateNotification(name, playing: true);
        }
    }

    // ── AudioFocus ────────────────────────────────────────────────────────────

    private bool RequestAudioFocus()
    {
        if (_audioManager == null) return true;
#pragma warning disable CA1422 // Deprecated on API 26+ but still works; avoids AudioFocusRequest compat boilerplate
        return _audioManager.RequestAudioFocus(this, Android.Media.Stream.Music, AudioFocus.Gain)
               == AudioFocusRequest.Granted;
#pragma warning restore CA1422
    }

    private void AbandonAudioFocus()
    {
        if (_audioManager == null) return;
#pragma warning disable CA1422
        _audioManager.AbandonAudioFocus(this);
#pragma warning restore CA1422
    }

    /// <summary>
    /// Called by the system when another app takes or returns audio focus.
    /// Duck/pause on loss; resume on gain.
    /// </summary>
    public void OnAudioFocusChange(AudioFocus focusChange)
    {
        switch (focusChange)
        {
            case AudioFocus.Loss:
            case AudioFocus.LossTransient:
                if (_isPlaying)
                {
                    _player?.Pause();
                    _isPlaying = false;
                    var n = _currentIndex >= 0 ? Stations.All[_currentIndex].Name : "";
                    Post($"⏸  {n}");
                }
                break;

            case AudioFocus.Gain:
                if (_player != null && !_isPlaying && !_isPreparing)
                {
                    _player.Start();
                    _isPlaying = true;
                    var n = _currentIndex >= 0 ? Stations.All[_currentIndex].Name : "";
                    Post($"▶  {n}");
                }
                break;
        }
    }

    // ── Notification ──────────────────────────────────────────────────────────

    private void CreateNotificationChannel()
    {
        if (Build.VERSION.SdkInt < BuildVersionCodes.O) return;

        var channel = new NotificationChannel(ChannelId, "Radio Nermeen", NotificationImportance.Low)
        {
            Description = "Radio playback controls"
        };
        channel.SetShowBadge(false);
        ((NotificationManager?)GetSystemService(NotificationService))?.CreateNotificationChannel(channel);
    }

    /// <summary>
    /// Promote to a foreground service so the OS will not kill it while audio is active.
    /// Must be called quickly after the service is started (within ~5 seconds on API 26+).
    /// </summary>
    private void EnsureForeground(string stationName)
    {
        var notification = BuildNotification(stationName, playing: false);

        if (Build.VERSION.SdkInt >= BuildVersionCodes.Q)
        {
            // ForegroundService.MediaPlayback == 4 (android.content.pm.ServiceInfo)
            StartForeground(NotificationId, notification, (Android.Content.PM.ForegroundService)4);
        }
        else
        {
            StartForeground(NotificationId, notification);
        }
    }

    private void UpdateNotification(string stationName, bool playing)
        => ((NotificationManager?)GetSystemService(NotificationService))
           ?.Notify(NotificationId, BuildNotification(stationName, playing));

    private Notification BuildNotification(string stationName, bool playing)
    {
        // Tapping the notification returns the user to the app.
        var launchIntent = new Intent(this, typeof(MainActivity));
        launchIntent.SetFlags(ActivityFlags.SingleTop);
        var pendingFlags = Build.VERSION.SdkInt >= BuildVersionCodes.M
            ? PendingIntentFlags.Immutable
            : PendingIntentFlags.UpdateCurrent;
        var pi = PendingIntent.GetActivity(this, 0, launchIntent, pendingFlags);

        Notification.Builder builder;
#pragma warning disable CA1422 // Single-arg constructor deprecated on API 26+ — handled by branch above
        builder = Build.VERSION.SdkInt >= BuildVersionCodes.O
            ? new Notification.Builder(this, ChannelId)
            : new Notification.Builder(this);
#pragma warning restore CA1422

        return builder
            .SetContentTitle("راديو نرمين")
            .SetContentText(stationName)
            .SetSmallIcon(Android.Resource.Drawable.IcMediaPlay)
            .SetContentIntent(pi)
            .SetOngoing(playing)
            .SetVisibility(NotificationVisibility.Public)
            .SetStyle(new Notification.MediaStyle())
            .Build()!;
    }

    // ── .pls Resolver ─────────────────────────────────────────────────────────

    /// <summary>
    /// Shoutcast/Icecast servers sometimes expose a <c>.pls</c> playlist instead of a
    /// direct stream URL. <see cref="MediaPlayer"/> cannot reliably follow these
    /// redirects on its own, so we fetch and parse the file first.
    ///
    /// Returns the <c>File1=</c> entry from the playlist, or the original
    /// <paramref name="url"/> unchanged on any error or if it is not a .pls.
    /// </summary>
    private static async Task<string> ResolvePlsAsync(string url)
    {
        if (!url.Contains(".pls", StringComparison.OrdinalIgnoreCase)) return url;

        try
        {
            using var client = new System.Net.Http.HttpClient { Timeout = TimeSpan.FromSeconds(8) };
            var text = await client.GetStringAsync(url).ConfigureAwait(false);

            foreach (var line in text.Split('\n'))
            {
                var trimmed = line.Trim();
                if (trimmed.StartsWith("File1=", StringComparison.OrdinalIgnoreCase))
                    return trimmed[6..].Trim();
            }
        }
        catch
        {
            // Network error or parse failure — fall back and let MediaPlayer attempt.
        }

        return url;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>Post <paramref name="status"/> to <see cref="StatusChanged"/> on the main thread.</summary>
    private void Post(string status)
        => _mainHandler?.Post(() => StatusChanged?.Invoke(status));

    private void ReleasePlayer()
    {
        if (_player == null) return;
        try { _player.Stop(); } catch (Java.Lang.Exception) { /* ignore un-prepared state */ }
        _player.Reset();
        _player.Release();
        _player      = null;
        _isPlaying   = false;
        _isPreparing = false;
    }

    // ── Binder (IPC bridge to MainActivity) ──────────────────────────────────

    /// <summary>
    /// Exposes a direct reference to the service so <see cref="MainActivity"/>
    /// can call methods and subscribe to events without intent-based IPC.
    /// </summary>
    public sealed class RadioBinder : Binder
    {
        public RadioPlayerService Service { get; }
        public RadioBinder(RadioPlayerService service) => Service = service;
    }
}
