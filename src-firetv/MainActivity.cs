using Android.App;
using Android.Content.PM;
using Android.Graphics;
using Android.OS;
using Android.Views;
using Android.Webkit;
using Android.Widget;

namespace RadioNermeen.FireTV;

/// <summary>
/// Immersive full-screen Fire TV activity hosting the official Radio Nermeen web application
/// with hardware-accelerated rendering and Fire TV remote D-Pad spatial navigation.
/// </summary>
[Activity(
    Name = "com.nilefusion.radionermeen.MainActivity",
    Label = "Radio Nermeen",
    Exported = true,
    ConfigurationChanges = ConfigChanges.Orientation | ConfigChanges.ScreenSize
                         | ConfigChanges.KeyboardHidden | ConfigChanges.UiMode,
    ScreenOrientation = ScreenOrientation.Landscape,
    Theme = "@android:style/Theme.NoTitleBar.Fullscreen")]
[IntentFilter(
    new[] { Android.Content.Intent.ActionMain },
    Categories = new[]
    {
        Android.Content.Intent.CategoryLauncher,
        "android.intent.category.LEANBACK_LAUNCHER"
    })]
public class MainActivity : Activity
{
    private const string AppUrl = "https://radionermeen.azurewebsites.net";

    private WebView _webView = null!;
    private ProgressBar _loadingSpinner = null!;
    private RelativeLayout _rootLayout = null!;

    // JavaScript code for Fire TV spatial D-pad navigation and neon focus rings
    private const string TvNavigationScript = @"
(function() {
    if (window.__tvNavInitialized) return;
    window.__tvNavInitialized = true;

    // Inject TV Focus Styling
    const style = document.createElement('style');
    style.id = 'tv-navigation-styles';
    style.innerHTML = `
        /* TV Focus Styles */
        .station-card.tv-focused, .station-card:focus-visible {
            outline: none !important;
            transform: scale(1.08) translateY(-6px) !important;
            box-shadow: 0 0 0 3px #ff4e88, 0 16px 36px rgba(255, 78, 136, 0.6) !important;
            border-color: #ff4e88 !important;
            z-index: 50 !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .play-btn.tv-focused, .play-btn:focus-visible {
            outline: none !important;
            transform: scale(1.2) !important;
            box-shadow: 0 0 0 4px #ffffff, 0 0 30px #ff4e88 !important;
        }
        .card-fav-btn.tv-focused, .card-fav-btn:focus-visible,
        .fav-toggle-btn.tv-focused, .fav-toggle-btn:focus-visible {
            outline: none !important;
            transform: scale(1.25) !important;
            box-shadow: 0 0 0 3px #ff4e88 !important;
        }
        /* Disable text selection for clean TV display */
        * {
            -webkit-user-select: none !important;
            user-select: none !important;
        }
        /* Hide mobile PWA installation banner on Fire TV */
        .pwa-banner {
            display: none !important;
            visibility: hidden !important;
        }
        /* Smooth scrolling */
        html, body {
            scroll-behavior: smooth !important;
        }
    `;
    document.head.appendChild(style);

    let currentCardIndex = 0;
    let focusTarget = 'card'; // 'card' or 'player'

    function getCards() {
        return Array.from(document.querySelectorAll('.station-card'));
    }

    function highlightCard(idx) {
        const cards = getCards();
        if (!cards.length) return;

        currentCardIndex = Math.max(0, Math.min(idx, cards.length - 1));
        focusTarget = 'card';

        const playBtn = document.querySelector('.play-btn');
        if (playBtn) playBtn.classList.remove('tv-focused');

        cards.forEach((card, i) => {
            if (i === currentCardIndex) {
                card.classList.add('tv-focused');
                card.focus();
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                card.classList.remove('tv-focused');
            }
        });
    }

    function highlightPlayer() {
        const cards = getCards();
        cards.forEach(c => c.classList.remove('tv-focused'));

        const playBtn = document.querySelector('.play-btn');
        if (playBtn) {
            focusTarget = 'player';
            playBtn.classList.add('tv-focused');
            playBtn.focus();
            playBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function getGridCols(cards) {
        if (cards.length < 2) return 1;
        const firstTop = cards[0].getBoundingClientRect().top;
        let count = 0;
        for (let i = 0; i < cards.length; i++) {
            if (Math.abs(cards[i].getBoundingClientRect().top - firstTop) < 15) {
                count++;
            } else {
                break;
            }
        }
        return count > 0 ? count : 4;
    }

    // Handle Fire TV Remote D-Pad & Keyboard Keys
    window.addEventListener('keydown', function(e) {
        const cards = getCards();
        if (!cards.length) return;

        const cols = getGridCols(cards);
        const isRtl = document.dir === 'rtl' || document.documentElement.dir === 'rtl';

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                if (focusTarget === 'player') return;
                // In RTL layout, ArrowRight moves to visually previous card (towards right)
                if (isRtl) {
                    if (currentCardIndex > 0) highlightCard(currentCardIndex - 1);
                } else {
                    if (currentCardIndex < cards.length - 1) highlightCard(currentCardIndex + 1);
                }
                break;

            case 'ArrowLeft':
                e.preventDefault();
                if (focusTarget === 'player') return;
                // In RTL layout, ArrowLeft moves to visually next card (towards left)
                if (isRtl) {
                    if (currentCardIndex < cards.length - 1) highlightCard(currentCardIndex + 1);
                } else {
                    if (currentCardIndex > 0) highlightCard(currentCardIndex - 1);
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (focusTarget === 'player') return;
                if (currentCardIndex + cols < cards.length) {
                    highlightCard(currentCardIndex + cols);
                } else {
                    highlightPlayer();
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (focusTarget === 'player') {
                    highlightCard(currentCardIndex);
                } else if (currentCardIndex - cols >= 0) {
                    highlightCard(currentCardIndex - cols);
                }
                break;

            case 'Enter':
            case 'Select':
                e.preventDefault();
                if (focusTarget === 'player') {
                    const playBtn = document.querySelector('.play-btn');
                    if (playBtn) playBtn.click();
                } else if (cards[currentCardIndex]) {
                    cards[currentCardIndex].click();
                }
                break;
        }
    });

    // Remote play/pause key
    window.tvTogglePlay = function() {
        const playBtn = document.querySelector('.play-btn');
        if (playBtn) playBtn.click();
    };

    // Initial highlight after render
    setTimeout(() => {
        highlightCard(0);
    }, 1000);
})();
";

    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);

        // Keep the screen awake during radio streaming
        Window?.AddFlags(WindowManagerFlags.KeepScreenOn);

        _rootLayout = new RelativeLayout(this);
        _rootLayout.SetBackgroundColor(Color.ParseColor("#0b0d14"));

        _webView = new WebView(this);
        var webParams = new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MatchParent,
            ViewGroup.LayoutParams.MatchParent);
        _rootLayout.AddView(_webView, webParams);

        // Loading spinner while initial web content loads
        _loadingSpinner = new ProgressBar(this)
        {
            Indeterminate = true
        };
        var spinParams = new RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.WrapContent,
            ViewGroup.LayoutParams.WrapContent);
        spinParams.AddRule(LayoutRules.CenterInParent);
        _rootLayout.AddView(_loadingSpinner, spinParams);

        SetContentView(_rootLayout);

        ConfigureWebView();

        if (savedInstanceState != null)
        {
            _webView.RestoreState(savedInstanceState);
        }
        else
        {
            _webView.LoadUrl(AppUrl);
        }
    }

    private void ConfigureWebView()
    {
        var settings = _webView.Settings;
        settings.JavaScriptEnabled = true;
        settings.DomStorageEnabled = true;
        settings.DatabaseEnabled = true;
        settings.MediaPlaybackRequiresUserGesture = false;
        settings.LoadWithOverviewMode = true;
        settings.UseWideViewPort = true;
        settings.CacheMode = CacheModes.Default;
        settings.MixedContentMode = MixedContentHandling.AlwaysAllow;
        settings.SetSupportZoom(false);
        settings.BuiltInZoomControls = false;

        _webView.SetLayerType(LayerType.Hardware, null);
        _webView.Focusable = true;
        _webView.FocusableInTouchMode = true;
        _webView.RequestFocus();

        _webView.SetWebChromeClient(new WebChromeClient());
        _webView.SetWebViewClient(new RadioWebViewClient(this));
    }

    private class RadioWebViewClient : WebViewClient
    {
        private readonly MainActivity _activity;
        public RadioWebViewClient(MainActivity activity) => _activity = activity;

        public override void OnPageFinished(WebView? view, string? url)
        {
            base.OnPageFinished(view, url);
            _activity._loadingSpinner.Visibility = ViewStates.Gone;

            // Inject Fire TV D-Pad spatial navigation and focus styling
            view?.EvaluateJavascript(TvNavigationScript, null);
        }

        public override void OnReceivedError(WebView? view, IWebResourceRequest? request, WebResourceError? error)
        {
            base.OnReceivedError(view, request, error);
            _activity._loadingSpinner.Visibility = ViewStates.Gone;
        }
    }

    // Handle Fire TV Remote Keys
    public override bool DispatchKeyEvent(KeyEvent? e)
    {
        if (e != null && e.Action == KeyEventActions.Down)
        {
            switch (e.KeyCode)
            {
                case Keycode.MediaPlayPause:
                case Keycode.MediaPlay:
                case Keycode.MediaPause:
                    _webView.EvaluateJavascript("window.tvTogglePlay && window.tvTogglePlay();", null);
                    return true;

                case Keycode.Back:
                    if (_webView.CanGoBack())
                    {
                        _webView.GoBack();
                        return true;
                    }
                    break;
            }
        }

        return base.DispatchKeyEvent(e);
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
