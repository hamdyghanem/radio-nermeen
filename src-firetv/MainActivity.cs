using Android.App;
using Android.Content;
using Android.Content.PM;
using Android.Graphics;
using Android.Graphics.Drawables;
using Android.OS;
using Android.Views;
using Android.Widget;

namespace RadioNermeen.FireTV;

/// <summary>
/// Full-screen landscape activity for Amazon Fire TV.
///
/// All audio work is delegated to <see cref="RadioPlayerService"/> so that
/// playback continues after the user presses Home and this activity goes to
/// the background.  The activity binds to the service in <see cref="OnStart"/>
/// and unbinds in <see cref="OnStop"/>; because the service is also "started"
/// (via <see cref="StartService"/>) at the moment playback begins, it stays
/// alive independently of the binding.
/// </summary>
[Activity(
    Name   = "com.nilefusion.radionermeen.MainActivity",
    Label  = "Radio Nermeen",
    Exported = true,
    ConfigurationChanges = ConfigChanges.Orientation | ConfigChanges.ScreenSize
                         | ConfigChanges.KeyboardHidden | ConfigChanges.UiMode,
    ScreenOrientation = ScreenOrientation.Landscape,
    Theme  = "@android:style/Theme.NoTitleBar.Fullscreen")]
[IntentFilter(
    new[] { Android.Content.Intent.ActionMain },
    Categories = new[]
    {
        Android.Content.Intent.CategoryLauncher,
        "android.intent.category.LEANBACK_LAUNCHER"   // Required to appear on Fire TV home screen
    })]
public class MainActivity : Activity
{
    private static readonly Color Background = Color.ParseColor("#000000");
    private static readonly Color Accent     = Color.ParseColor("#ff5ea8");
    private static readonly Color CardColor  = Color.ParseColor("#141821");
    private static readonly Color TextColor  = Color.ParseColor("#ffffff");
    private static readonly Color MutedColor = Color.ParseColor("#9aa0aa");

    private TextView              _nowPlaying     = null!;
    private readonly List<Button> _stationButtons = new();

    private RadioPlayerService?     _radioService;
    private RadioServiceConnection? _serviceConnection;
    private bool                    _serviceBound;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);

        // Keep the screen awake while the app is in the foreground.
        Window?.AddFlags(WindowManagerFlags.KeepScreenOn);

        SetContentView(BuildUi());

        // Give the first station button initial d-pad focus so the remote
        // can start navigating immediately without an extra button press.
        if (_stationButtons.Count > 0)
            _stationButtons[0].RequestFocus();
    }

    protected override void OnStart()
    {
        base.OnStart();
        _serviceConnection = new RadioServiceConnection(this);
        BindService(
            new Intent(this, typeof(RadioPlayerService)),
            _serviceConnection,
            Bind.AutoCreate);
        _serviceBound = true;
    }

    protected override void OnStop()
    {
        if (_serviceBound && _serviceConnection != null)
        {
            // Unsubscribe before unbinding to avoid a dangling event subscription.
            if (_radioService != null)
                _radioService.StatusChanged -= OnStatusChanged;

            UnbindService(_serviceConnection);
            _serviceBound  = false;
            _radioService  = null;
        }

        base.OnStop();
    }

    protected override void OnDestroy() => base.OnDestroy();

    // ── Service connection callbacks (called by RadioServiceConnection) ────────

    internal void OnServiceConnected(RadioPlayerService service)
    {
        _radioService = service;
        service.StatusChanged += OnStatusChanged;

        // Sync the status label with whatever the service is currently doing
        // (e.g. the user rotated the screen while a stream was playing).
        SyncStatusFromService(service);
    }

    internal void OnServiceDisconnected()
    {
        if (_radioService != null)
            _radioService.StatusChanged -= OnStatusChanged;
        _radioService = null;
    }

    // StatusChanged fires on the main thread (guaranteed by RadioPlayerService.Post).
    private void OnStatusChanged(string status) => _nowPlaying.Text = status;

    private void SyncStatusFromService(RadioPlayerService svc)
    {
        if (svc.IsPreparing)
        {
            var n = svc.CurrentIndex >= 0 ? Stations.All[svc.CurrentIndex].Name : "";
            _nowPlaying.Text = $"جارٍ التحميل… {n}";
        }
        else if (svc.IsPlaying)
        {
            var n = svc.CurrentIndex >= 0 ? Stations.All[svc.CurrentIndex].Name : "";
            _nowPlaying.Text = $"▶  {n}";
        }
        else
        {
            _nowPlaying.Text = "اختر محطة للتشغيل";
        }
    }

    // ── Playback actions ──────────────────────────────────────────────────────

    private void PlayStation(int index)
    {
        if (_radioService == null) return;

        // Ensure the service is also "started" (not only bound) so it survives
        // this activity going to the background when the user presses Home.
        StartService(new Intent(this, typeof(RadioPlayerService)));

        _radioService.PlayStation(index);
    }

    private void TogglePlayPause() => _radioService?.TogglePlayPause();

    // ── Remote key handling ───────────────────────────────────────────────────

    /// <summary>
    /// Handle Fire TV remote media keys and d-pad center.
    ///
    /// • Media Play/Pause/Play+Pause — toggle playback unconditionally.
    /// • D-pad Center / Select — toggle playback only when the focused view is
    ///   NOT a station button (so clicking a station button still works normally).
    /// </summary>
    public override bool DispatchKeyEvent(KeyEvent? e)
    {
        if (e?.Action == KeyEventActions.Down)
        {
            switch (e.KeyCode)
            {
                case Keycode.MediaPlayPause:
                case Keycode.MediaPlay:
                case Keycode.MediaPause:
                    TogglePlayPause();
                    return true;

                case Keycode.DpadCenter:
                case Keycode.ButtonSelect:
                    // Only intercept if focus is not on a station button;
                    // otherwise the button's own Click event handles it.
                    if (CurrentFocus is not Button btn || !_stationButtons.Contains(btn))
                    {
                        TogglePlayPause();
                        return true;
                    }
                    break;
            }
        }

        return base.DispatchKeyEvent(e);
    }

    // ── UI ────────────────────────────────────────────────────────────────────

    private View BuildUi()
    {
        var root = new LinearLayout(this) { Orientation = Android.Widget.Orientation.Vertical };
        root.SetBackgroundColor(Background);
        root.SetPadding(Dp(48), Dp(32), Dp(48), Dp(24));

        // App title
        var title = new TextView(this)
        {
            Text           = "راديو نرمين",
            TextAlignment  = TextAlignment.Center,
        };
        title.SetTextColor(Accent);
        title.SetTextSize(Android.Util.ComplexUnitType.Sp, 30);
        title.SetTypeface(null, TypefaceStyle.Bold);
        root.AddView(title);

        // Now-playing status line
        _nowPlaying = new TextView(this)
        {
            Text          = "اختر محطة للتشغيل",
            TextAlignment = TextAlignment.Center,
        };
        _nowPlaying.SetTextColor(MutedColor);
        _nowPlaying.SetTextSize(Android.Util.ComplexUnitType.Sp, 16);
        _nowPlaying.SetPadding(0, Dp(8), 0, Dp(20));
        root.AddView(_nowPlaying);

        // Station list
        var scroll = new ScrollView(this);
        var list   = new LinearLayout(this) { Orientation = Android.Widget.Orientation.Vertical };

        for (int i = 0; i < Stations.All.Length; i++)
        {
            var index   = i;
            var station = Stations.All[index];

            var button = new Button(this)
            {
                Text = $"{station.Name}   •   {station.Freq}",
            };
            button.SetAllCaps(false);
            button.SetTextColor(TextColor);
            button.SetTextSize(Android.Util.ComplexUnitType.Sp, 18);
            button.Gravity    = GravityFlags.CenterVertical | GravityFlags.End;
            button.Background = CreateStationBackground();
            button.SetPadding(Dp(24), Dp(18), Dp(24), Dp(18));

            var lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MatchParent,
                ViewGroup.LayoutParams.WrapContent);
            lp.SetMargins(0, Dp(6), 0, Dp(6));
            button.LayoutParameters = lp;

            button.Click += (_, _) => PlayStation(index);
            _stationButtons.Add(button);
            list.AddView(button);
        }

        scroll.AddView(list);
        root.AddView(scroll, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MatchParent,
            ViewGroup.LayoutParams.MatchParent));

        return root;
    }

    /// <summary>
    /// Dark card by default; accent-filled when focused or pressed so the
    /// current remote position is always visually obvious.
    /// </summary>
    private StateListDrawable CreateStationBackground()
    {
        var focused = new GradientDrawable();
        focused.SetColor(Accent);
        focused.SetCornerRadius(Dp(14));

        var normal = new GradientDrawable();
        normal.SetColor(CardColor);
        normal.SetCornerRadius(Dp(14));
        normal.SetStroke(Dp(1), Color.ParseColor("#232833"));

        var states = new StateListDrawable();
        states.AddState(new[] { Android.Resource.Attribute.StateFocused }, focused);
        states.AddState(new[] { Android.Resource.Attribute.StatePressed  }, focused);
        states.AddState(System.Array.Empty<int>(), normal);
        return states;
    }

    private int Dp(int value) => (int)(value * Resources!.DisplayMetrics!.Density);

    // ── Service connection ────────────────────────────────────────────────────

    /// <summary>
    /// Bridges the Android <see cref="IServiceConnection"/> callbacks back to
    /// type-safe methods on <see cref="MainActivity"/>.
    /// Must extend <see cref="Java.Lang.Object"/> for the Android runtime.
    /// </summary>
    private sealed class RadioServiceConnection : Java.Lang.Object, IServiceConnection
    {
        private readonly MainActivity _owner;
        public RadioServiceConnection(MainActivity owner) => _owner = owner;

        public void OnServiceConnected(ComponentName? name, IBinder? service)
        {
            if (service is RadioPlayerService.RadioBinder binder)
                _owner.OnServiceConnected(binder.Service);
        }

        public void OnServiceDisconnected(ComponentName? name)
            => _owner.OnServiceDisconnected();
    }
}
