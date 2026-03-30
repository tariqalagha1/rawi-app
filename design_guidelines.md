# Design Guidelines: Rawi - AI Voice Companion

## 1. Brand Identity

**Purpose**: Rawi is a real-time AI voice chat companion that speaks to users in Arabic, providing intelligent conversation with natural voice output.

**Aesthetic Direction**: **Calm Tech** - Dark, focused, minimal interface that puts the conversation first. Think late-night radio host meets sophisticated AI. The design should feel intimate and distraction-free, with subtle motion and breathing room.

**Memorable Element**: The pulsing connection indicator that "breathes" when AI is speaking, creating a sense of presence and aliveness.

## 2. Navigation Architecture

**Type**: Stack-Only (single-screen focus)

The app is conversation-first. Additional features accessed via header buttons:
- **Main Screen**: Chat interface (default)
- **Settings Modal**: Voice preferences, theme toggle, account (accessed via header icon)
- **About Modal**: App info, privacy policy (accessed from settings)

## 3. Screen-by-Screen Specifications

### Main Chat Screen
**Purpose**: Real-time conversation with AI assistant

**Header**:
- Custom header, transparent background with subtle gradient fade
- Left: Settings icon (gear)
- Center: App logo "رواي" + connection status dot
- Right: Clear chat icon (trash)
- No search bar

**Main Content**:
- ScrollView (inverted for chat, newest at bottom)
- Chat bubbles with message history
- Loading indicator when AI is responding
- Empty state: Illustration with suggested prompts in Arabic

**Floating Elements**:
- Voice selector carousel (horizontal scroll) sits above input
- Input bar with text field + send button, fixed to bottom
- Safe area insets: 
  - Top: insets.top + Spacing.xl (no tab bar)
  - Bottom: insets.bottom + Spacing.xl (input bar is floating)

**Components**:
- Message bubbles (user/AI differentiated by color + alignment)
- Voice selection chips (horizontal scrollable)
- Text input with RTL support
- Send button (always visible, disabled when empty/loading)
- Connection status indicator (pulsing dot)

### Settings Modal
**Purpose**: Customize voice, theme, manage account

**Header**:
- Standard modal header with "الإعدادات" title
- Right: Close button (X)

**Main Content**:
- Scrollable form with sections:
  - Voice Settings (default voice, speed, pitch sliders)
  - Appearance (theme toggle: Dark/Light)
  - Account (name, avatar, sign out, delete account)
  - About (version, privacy policy, terms)

## 4. Color Palette

**Primary Colors**:
- Background: #1a1a2e (deep navy)
- Surface: #252542 (elevated elements)
- Primary Accent: #4CAF50 (AI active state, send button)
- Secondary Accent: #7C4DFF (user message bubbles)

**Text Colors**:
- Primary: #FFFFFF
- Secondary: #888888
- Disabled: #444444

**Semantic Colors**:
- Success/Connected: #4CAF50
- Error/Disconnected: #f44336
- Loading: #4CAF50 (matches primary)

**Message Bubbles**:
- User: #4a4a6a (purple-gray)
- AI: #2a2a4a (darker purple-blue)
- System: #333333 with yellow text (#FFC107)

## 5. Typography

**Font**: System font (SF Pro for iOS, Roboto for Android) with full RTL support

**Type Scale**:
- Title (App Name): 42px, Bold, #FFFFFF
- Subtitle (Tagline): 16px, Regular, #888888
- Message Text: 16px, Regular, #FFFFFF, text-align: right
- Button Text: 16px, Bold, #FFFFFF
- Voice Name: 14px, Regular, #FFFFFF
- Placeholder: 14px, Regular, #666666

## 6. Visual Design

**Message Bubbles**:
- Border radius: 15px
- Padding: 15px
- Max width: 85% of screen
- User bubbles: align right
- AI bubbles: align left
- Subtle entrance animation (fade + slide)

**Voice Selection Chips**:
- Border radius: 20px
- Padding: 8px horizontal, 15px vertical
- Default: #333333 background
- Active: #4CAF50 background
- Horizontal scroll, centered alignment

**Input Bar**:
- Border radius: 20px
- Background: #333333
- Padding: 10px horizontal, 15px vertical
- RTL text alignment
- Send button: #4CAF50, 20px border radius, bold text

**Connection Indicator**:
- 10px circular dot
- Pulsing animation when AI is speaking (scale 1.0 → 1.3 → 1.0, 2s duration)
- Static when idle

**Touchable Feedback**:
- All buttons: opacity 0.7 on press
- Voice chips: scale 0.95 on press
- Send button: scale 0.98 on press

## 7. Assets to Generate

### Required Assets

**icon.png**
- Description: App icon featuring Arabic calligraphy-style "ر" (R for Rawi) in white on #4CAF50 gradient background with sound wave pattern
- Where used: Device home screen

**splash-icon.png**
- Description: Same as icon.png but optimized for splash screen
- Where used: App launch screen

**empty-chat.png**
- Description: Minimal illustration of a microphone with subtle sound waves, monochromatic in #4a4a6a
- Where used: Main chat screen when no messages exist

**ai-avatar.png**
- Description: Abstract geometric pattern representing AI (hexagons + circles) in #4CAF50 and #7C4DFF
- Where used: Next to AI messages (optional, can be text badge instead)

### Recommended Assets

**onboarding-voice.png**
- Description: Illustration showing phone with voice waves emanating, Arabic text saying "تحدث معي"
- Where used: First-time user onboarding (if implemented)

**settings-header.png**
- Description: Decorative header pattern with sound wave motif in #252542
- Where used: Top of settings modal (optional)

---

**Implementation Notes for Engineer**:
- Ensure RTL (right-to-left) layout for all Arabic text
- Use Expo's Audio API for playback with proper permissions
- Input should auto-focus after sending message
- Implement haptic feedback on send button press
- Chat should auto-scroll to bottom when new message arrives
- Connection status should check API health every 30 seconds
- Clear chat should show confirmation alert before deleting history