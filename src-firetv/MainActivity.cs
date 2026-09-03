using Android.App;
using Android.Content.PM;
using Android.OS;
using Android.Views;
using Android.Webkit;
using Android.Widget;

namespace RadioNermeen.FireTV;

[Activity(
    Label = "Radio Nermeen",
    ConfigurationChanges = ConfigChanges.Orientation | ConfigChanges.ScreenSize | ConfigChanges.KeyboardHidden | ConfigChanges.UiMode,
    ScreenOrientation = ScreenOrientation.Landscape,
    Theme = "@android:style/Theme.NoTitleBar.Fullscreen")]
public class MainActivity : Activity
{
    private const string AppUrl = "https://radionermeen.azurewebsites.net";

    private WebView _webView = null!;

    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);

        // Keep the screen awake while streaming audio.
        Window?.AddFlags(WindowManagerFlags.KeepScreenOn);

        _webView = new WebView(this);
        SetContentView(_webView);

        var settings = _webView.Settings;
        settings.JavaScriptEnabled = true;
        settings.DomStorageEnabled = true;
        settings.DatabaseEnabled = true;
        settings.MediaPlaybackRequiresUserGesture = false;
        settings.LoadWithOverviewMode = true;
        settings.UseWideViewPort = true;
        settings.CacheMode = CacheModes.Default;
        settings.MixedContentMode = MixedContentHandling.CompatibilityMode;

        // Keep navigation inside the app's WebView.
        _webView.SetWebViewClient(new WebViewClient());
        _webView.SetWebChromeClient(new WebChromeClient());

        _webView.Focusable = true;
        _webView.FocusableInTouchMode = true;
        _webView.RequestFocus();

        if (savedInstanceState != null)
        {
            _webView.RestoreState(savedInstanceState);
        }
        else
        {
            _webView.LoadUrl(AppUrl);
        }
    }

    // Let the Fire TV remote BACK button navigate web history before exiting.
    public override bool OnKeyDown(Keycode keyCode, KeyEvent? e)
    {
        if (keyCode == Keycode.Back && _webView.CanGoBack())
        {
            _webView.GoBack();
            return true;
        }

        return base.OnKeyDown(keyCode, e);
    }

    protected override void OnSaveInstanceState(Bundle outState)
    {
        base.OnSaveInstanceState(outState);
        _webView.SaveState(outState);
    }

    protected override void OnPause()
    {
        base.OnPause();
        _webView.OnPause();
    }

    protected override void OnResume()
    {
        base.OnResume();
        _webView.OnResume();
    }

    protected override void OnDestroy()
    {
        _webView.StopLoading();
        _webView.Destroy();
        base.OnDestroy();
    }
}
