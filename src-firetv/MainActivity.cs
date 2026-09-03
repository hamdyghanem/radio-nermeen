using Android.App;
using Android.Content.PM;
using Android.Graphics;
using Android.Graphics.Drawables;
using Android.Media;
using Android.OS;
using Android.Views;
using Android.Widget;

namespace RadioNermeen.FireTV;

[Activity(
    Name = "com.nilefusion.radionermeen.MainActivity",
    Label = "Radio Nermeen",
    Exported = true,
    ConfigurationChanges = ConfigChanges.Orientation | ConfigChanges.ScreenSize | ConfigChanges.KeyboardHidden | ConfigChanges.UiMode,
    ScreenOrientation = ScreenOrientation.Landscape,
    Theme = "@android:style/Theme.NoTitleBar.Fullscreen")]
[IntentFilter(
    new[] { Android.Content.Intent.ActionMain },
    Categories = new[] { Android.Content.Intent.CategoryLauncher, "android.intent.category.LEANBACK_LAUNCHER" })]
public class MainActivity : Activity
{
    private static readonly Color Background = Color.ParseColor("#000000");
    private static readonly Color Accent = Color.ParseColor("#ff5ea8");
    private static readonly Color CardColor = Color.ParseColor("#141821");
    private static readonly Color TextColor = Color.ParseColor("#ffffff");
    private static readonly Color MutedColor = Color.ParseColor("#9aa0aa");

    private MediaPlayer? _player;
    private TextView _nowPlaying = null!;
    private readonly List<Button> _stationButtons = new();
    private int _currentIndex = -1;
    private bool _isPlaying;
    private bool _isPreparing;

    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);

        // Keep the screen awake while streaming audio.
        Window?.AddFlags(WindowManagerFlags.KeepScreenOn);

        SetContentView(BuildUi());

        // Focus the first station so the remote can start navigating immediately.
        if (_stationButtons.Count > 0)
        {
            _stationButtons[0].RequestFocus();
        }
    }

    private View BuildUi()
    {
        var root = new LinearLayout(this)
        {
            Orientation = Android.Widget.Orientation.Vertical,
        };
        root.SetBackgroundColor(Background);
        root.SetPadding(Dp(48), Dp(32), Dp(48), Dp(24));

        var title = new TextView(this)
        {
            Text = "راديو نرمين",
            TextAlignment = TextAlignment.Center,
        };
        title.SetTextColor(Accent);
        title.SetTextSize(Android.Util.ComplexUnitType.Sp, 30);
        title.SetTypeface(null, TypefaceStyle.Bold);
        root.AddView(title);

        _nowPlaying = new TextView(this)
        {
            Text = "اختر محطة للتشغيل",
            TextAlignment = TextAlignment.Center,
        };
        _nowPlaying.SetTextColor(MutedColor);
        _nowPlaying.SetTextSize(Android.Util.ComplexUnitType.Sp, 16);
        _nowPlaying.SetPadding(0, Dp(8), 0, Dp(20));
        root.AddView(_nowPlaying);

        var scroll = new ScrollView(this);
        var list = new LinearLayout(this) { Orientation = Android.Widget.Orientation.Vertical };

        for (int i = 0; i < Stations.All.Length; i++)
        {
            var index = i;
            var station = Stations.All[index];
            var button = new Button(this)
            {
                Text = $"{station.Name}   •   {station.Freq}",
            };
            button.SetAllCaps(false);
            button.SetTextColor(TextColor);
            button.SetTextSize(Android.Util.ComplexUnitType.Sp, 18);
            button.Gravity = GravityFlags.CenterVertical | GravityFlags.End;
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

    // Dark card by default, accent-filled when focused so the remote position is obvious.
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
        states.AddState(new[] { Android.Resource.Attribute.StatePressed }, focused);
        states.AddState(System.Array.Empty<int>(), normal);
        return states;
    }

    private void PlayStation(int index)
    {
        if (index < 0 || index >= Stations.All.Length)
        {
            return;
        }

        var station = Stations.All[index];
        _currentIndex = index;
        _isPreparing = true;
        _isPlaying = false;
        _nowPlaying.Text = $"جارٍ التحميل… {station.Name}";

        ReleasePlayer();

        _player = new MediaPlayer();
        _player.SetAudioAttributes(new AudioAttributes.Builder()!
            .SetUsage(AudioUsageKind.Media)!
            .SetContentType(AudioContentType.Music)!
            .Build()!);

        _player.Prepared += (_, _) =>
        {
            _isPreparing = false;
            _isPlaying = true;
            _player?.Start();
            _nowPlaying.Text = $"▶  {station.Name}";
        };

        _player.Error += (_, _) =>
        {
            _isPreparing = false;
            _isPlaying = false;
            _nowPlaying.Text = $"تعذّر تشغيل: {station.Name}";
        };

        try
        {
            _player.SetDataSource(station.Stream);
            _player.PrepareAsync();
        }
        catch (Java.Lang.Exception)
        {
            _isPreparing = false;
            _nowPlaying.Text = $"تعذّر تشغيل: {station.Name}";
        }
    }

    private void TogglePlayPause()
    {
        if (_player == null)
        {
            if (_stationButtons.Count > 0)
            {
                PlayStation(_currentIndex >= 0 ? _currentIndex : 0);
            }
            return;
        }

        if (_isPreparing)
        {
            return;
        }

        if (_isPlaying)
        {
            _player.Pause();
            _isPlaying = false;
            if (_currentIndex >= 0)
            {
                _nowPlaying.Text = $"⏸  {Stations.All[_currentIndex].Name}";
            }
        }
        else
        {
            _player.Start();
            _isPlaying = true;
            if (_currentIndex >= 0)
            {
                _nowPlaying.Text = $"▶  {Stations.All[_currentIndex].Name}";
            }
        }
    }

    private void ReleasePlayer()
    {
        if (_player != null)
        {
            try
            {
                _player.Stop();
            }
            catch (Java.Lang.Exception)
            {
                // Ignore stop failures on an un-prepared player.
            }

            _player.Reset();
            _player.Release();
            _player = null;
        }
    }

    // Fire TV remote: play/pause keys toggle playback; Back exits normally.
    public override bool DispatchKeyEvent(KeyEvent? e)
    {
        if (e != null && e.Action == KeyEventActions.Down)
        {
            switch (e.KeyCode)
            {
                case Keycode.MediaPlayPause:
                case Keycode.MediaPlay:
                case Keycode.MediaPause:
                    TogglePlayPause();
                    return true;
            }
        }

        return base.DispatchKeyEvent(e);
    }

    protected override void OnPause()
    {
        base.OnPause();
        if (_isPlaying)
        {
            _player?.Pause();
        }
    }

    protected override void OnDestroy()
    {
        ReleasePlayer();
        base.OnDestroy();
    }

    private int Dp(int value) => (int)(value * Resources!.DisplayMetrics!.Density);
}
