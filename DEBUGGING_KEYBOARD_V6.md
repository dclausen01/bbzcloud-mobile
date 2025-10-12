# Debugging Keyboard Handler v6.0

## Console Messages to Look For

If the JavaScript is running correctly, you should see these messages in the console:

### On Page Load:

```
[BBZCloud] 🎹 Keyboard handler v6.0 - Aggressive viewport manipulation
[BBZCloud] 🎹 🚀 Initializing keyboard handler v6.0...
[BBZCloud] 🎹 Keyboard detection method
[BBZCloud] 🎹 ✅ Keyboard handler v6.0 initialized successfully
```

### When You Focus an Input:

```
[BBZCloud] 🎹 🎯 Input FOCUSED - AGGRESSIVE MODE
[BBZCloud] 🎹 2nd scroll attempt (100ms)
[BBZCloud] 🎹 3rd scroll attempt (300ms - keyboard visible)
```

### When Keyboard Appears:

```
[BBZCloud] 🎹 visualViewport resize
[BBZCloud] 🎹 🚨 KEYBOARD SHOWN - Applying aggressive layout changes
[BBZCloud] 🎹 ✅ Set fixed heights
```

### When Keyboard Disappears:

```
[BBZCloud] 🎹 🔄 KEYBOARD HIDDEN - Restoring original layout
[BBZCloud] 🎹 ✅ Original layout restored
```

## Visual Indicators

### Red Banner at Top

When the keyboard appears, you should see:

- Red banner with text "⌨️ KEYBOARD ACTIVE"
- Positioned at the very top center of the screen
- This confirms the JavaScript detected the keyboard

## What to Check If It's Not Working

### 1. No Console Messages at All

**Problem**: JavaScript might not be injecting
**Check**:

- Is schul.cloud loading fully?
- Are there any JavaScript errors in the console?
- Is the injection happening too early or too late?

### 2. Messages But No Height Changes

**Problem**: The page layout might be overriding our changes
**Look in Console**:

```
[BBZCloud] 🎹 ✅ Set fixed heights { htmlHeight: "XXXpx", bodyHeight: "XXXpx", availableHeight: XXX }
```

Then in the Elements tab, check if `html` and `body` actually have these height styles applied.

### 3. Height Changes But Input Still Covered

**Problem**: The page has nested containers with their own height constraints
**Solution**: We might need to add schul.cloud-specific overrides

## Chrome DevTools Access in Emulator

1. Open Android Studio
2. Run the app on emulator
3. Open schul.cloud in the app
4. In Chrome browser on your PC, go to: `chrome://inspect`
5. Find the WebView under "Remote Target"
6. Click "inspect"
7. This opens DevTools for the InAppBrowser

## Expected Behavior vs Actual

### Expected:

- Page height becomes: `visualViewport.height` (e.g., 600px when keyboard is 400px tall)
- Body scrollable within that constrained height
- Input visible within the available space

### If Still Not Working:

The issue might be that schul.cloud uses:

- iframes (our script runs in parent, not iframe)
- Shadow DOM (our selectors can't reach it)
- Very aggressive fixed positioning that overrides our changes
- CSS that's loaded after our injection

## Quick Fixes to Try

### If using iframes:

We'd need to inject the script into the iframe context as well.

### If shadow DOM:

We'd need to pierce the shadow DOM to access the inputs.

### If CSS override:

We might need to use `!important` more aggressively or inject styles later.
