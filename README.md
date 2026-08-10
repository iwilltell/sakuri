# 🌸 Sakuri — Project Specification

> **Sakuri** is a private, minimal, two-person shared space for storing dreams and memories.
>
> It is designed for exactly **two permanent accounts** and should work smoothly on **Android phones and laptops/desktops**.
>
> This document is the source of truth for the project. Any future development should follow these requirements unless explicitly changed.

---

# 1. 🌸 Project Vision

Sakuri is a private digital space shared between two people.

The application should feel:

- Cute
- Personal
- Minimal
- Romantic/friendly
- Clean
- Soft
- Modern
- Private

The visual identity should be based around:

- 🌸 Cherry blossoms
- 💗 Pink
- ❤️ Cherry red
- 🤍 White/cream
- 🧊 Glassmorphism
- Soft shadows
- Translucent cards
- Background images that change according to the time of day

The application must **not** become a social-media-style application.

There should be:

- No followers
- No likes
- No comments
- No public profiles
- No search system
- No unnecessary notifications
- No unnecessary features
- No fake/demo content

The goal is a small, polished private application for two people.

---

# 2. 👥 Accounts

Sakuri supports exactly **two permanent accounts**.

There should NOT be:

- Public registration
- Unlimited accounts
- User discovery
- Account search
- Followers/friends system

The two accounts are created during the initial setup.

Each account contains:

```text
User
├── Username
├── Email
├── Profile Picture
├── Description
├── 4-digit PIN/password
└── Authentication/session information
```

The email is used for security and OTP functionality.

The email address should not be publicly displayed in the normal UI.

---

# 3. 🔐 Authentication

## Login

When the application starts, it should show the two existing users.

Example:

```text
        [ Sakuri Logo ]

          Who are you?

      [ Profile Picture ]
           User 1

      [ Profile Picture ]
           User 2
```

The user selects their account.

Then Sakuri asks for the user's 4-digit PIN.

```text
Welcome, Username 🌸

Enter your PIN

      • • • •
```

The PIN must be exactly 4 digits.

---

# 4. 🔒 PIN Security

The PIN must NEVER be stored as plain text.

The backend must store a secure hash of the PIN.

The frontend must never receive the stored PIN/hash.

Authentication must be handled securely by the backend.

---

# 5. 📧 OTP Password/PIN Change

A user can change their 4-digit PIN.

Changing the PIN requires OTP verification.

Flow:

```text
Settings
   ↓
Change PIN
   ↓
Send OTP
   ↓
OTP sent to registered email
   ↓
Enter OTP
   ↓
Verify OTP
   ↓
Enter new 4-digit PIN
   ↓
Confirm new PIN
   ↓
PIN changed
```

The OTP should be sent automatically through the configured email service.

The application must NOT display fake OTPs.

The OTP must be generated and verified by the backend.

---

# 6. 🔑 Persistent Login

Once a user successfully logs in, they should remain logged in.

The user should NOT have to enter their PIN every time they:

- Close the browser
- Reopen the application
- Refresh the page
- Switch between pages

The session should persist securely.

The user should normally be logged out only when:

- They explicitly press Logout
- Their PIN/password is changed
- Their session is invalidated for security reasons

Changing the PIN should invalidate previous sessions for that account.

---

# 7. 🚪 Logout

Logout must be a real working feature.

When Logout is pressed:

```text
Current session
      ↓
Destroyed / invalidated
      ↓
Login screen
```

The user must authenticate again to access their account.

---

# 8. 👤 Profile

Each account has its own profile.

The profile contains:

- Profile picture
- Username
- Description

The user can edit:

- Username
- Profile picture
- Description

The email should not normally be editable from the normal profile editor.

---

# 9. 🌅 Dynamic Greeting

The profile/home area should automatically greet the currently logged-in user according to the current time.

Example:

### Morning

```text
Good morning, Username 🌸
```

### Noon/Afternoon

```text
Good afternoon, Username 🌸
```

### Evening

```text
Good evening, Username 🌸
```

### Night

```text
Good night, Username 🌙
```

The greeting must be generated dynamically.

Do NOT hardcode one greeting.

The greeting should automatically change as the day progresses.

---

# 10. 🖼️ Background Images

The user will provide background images manually.

There will be exactly **one permanent image for each time period**.

Suggested structure:

```text
public/
├── logo.png
└── images/
    ├── morning/
    │   └── background.jpg
    ├── noon/
    │   └── background.jpg
    ├── evening/
    │   └── background.jpg
    └── night/
        └── background.jpg
```

The exact file extensions may differ.

The application should load the appropriate image according to the current time.

Suggested time periods:

```text
05:00 – 11:59 → morning
12:00 – 16:59 → noon
17:00 – 20:59 → evening
21:00 – 04:59 → night
```

The time boundaries can be adjusted during implementation if necessary.

There is NO need for:

- Random backgrounds
- Background rotation
- Multiple backgrounds per period
- Daily background changes

One permanent image per period is sufficient.

---

# 11. 🌸 Sakuri Logo

The official Sakuri logo will be provided as a PNG.

Expected location:

```text
public/logo.png
```

The actual PNG must be used.

Do NOT recreate the logo using:

- Text
- CSS
- SVG recreation
- Placeholder graphics

Use the real logo wherever appropriate, including:

- Login screen
- Desktop navigation/sidebar
- Mobile header
- Favicon
- PWA/app icon where appropriate
- Other locations where the logo naturally belongs

Do not overuse the logo and make the UI cluttered.

---

# 12. 🧊 Glassmorphism Design

The entire application should use a polished glassmorphism design.

Core characteristics:

- Transparent/semi-transparent surfaces
- Backdrop blur
- Soft borders
- Subtle shadows
- Rounded corners
- Pink/red accents
- Light highlights
- Good readability

Example concept:

```text
Background Image
       ↓
Translucent Overlay
       ↓
Blurred Glass Card
       ↓
Content
```

The glass effect should remain readable.

Do NOT make the interface excessively transparent or blurry.

---

# 13. 🎨 Color Direction

Primary visual colors:

```text
Pink
Soft Pink
Cherry Red
Dark Red
White
Cream
Very Light Pink
```

Colors should be consistent throughout the application.

The UI should feel like:

> Cherry blossom + soft glass + minimal modern interface

Avoid excessive gradients, excessive neon effects, or overly complicated decorations.

---

# 14. 📱 Responsive Design

Sakuri must work on:

- Android phones
- Android tablets if possible
- Laptops
- Desktop browsers

The UI must adapt to screen size.

## Mobile

Use a compact navigation/header system.

## Desktop

A sidebar or wider navigation system can be used.

The same functionality must be available on both.

Do NOT build a desktop-only interface and attempt to fix mobile later.

Responsive design should be considered from the beginning.

---

# 15. 🌸 Main Application Sections

The application should remain small.

Primary sections:

```text
Home
Dreams
Memories
Profile
Settings
```

There is no need for a large navigation system.

---

# 16. 💗 Dreams

Users can create dreams.

A dream can contain:

- Title
- Description
- Images
- Optional location
- Optional target date
- Creator
- Created date/time
- Last edited date/time
- Private/shared status

The exact fields can be refined during implementation, but unnecessary fields should not be added.

---

# 17. ✨ Creating a Dream

The user presses:

```text
+ Create Dream
```

A real form opens.

The user enters the dream information.

When saved:

```text
Frontend
   ↓
Backend
   ↓
Database
   ↓
Dream created
```

The new dream should immediately appear in the UI.

No fake/demo entries should be inserted.

---

# 18. ⭐ Private Dreams

Every dream should support a private/shared state.

The star button controls this.

### Shared dream

```text
⭐ OFF
```

Both users can see it.

Both users can edit it.

### Private dream

```text
⭐ ON
```

Only the creator can see it.

Only the creator can edit it.

Privacy must be enforced by the backend/database logic.

It must NOT rely only on hiding the dream in the frontend.

---

# 19. ✏️ Editing Dreams

Both users can edit shared dreams.

The creator can edit private dreams.

When a dream is edited:

```text
createdAt
```

must remain unchanged.

The application must update:

```text
updatedAt
```

automatically.

Example:

```text
Created:
8 August 2026 • 3:42 PM

Last edited:
8 August 2026 • 4:18 PM
```

The user should never manually enter these timestamps.

---

# 20. 🗑️ Deleting Dreams

Dreams must be deletable.

Delete should be a real backend operation.

A confirmation should be displayed before deletion.

Example:

```text
Delete this dream?

        Cancel    Delete
```

After confirmation, the database record is actually deleted.

---

# 21. 📸 Dream Images

Images are OPTIONAL.

A user must be able to create a dream without uploading a picture.

Valid:

```text
Title
Description
No image
Save
```

Also valid:

```text
Title
Description
1 image
Save
```

And:

```text
Title
Description
Multiple images
Save
```

Images can be:

- Added during creation
- Added during editing
- Removed during editing
- Viewed in dream details

If there is no image, the UI should simply display the text/content layout.

Do NOT show:

- Broken image icons
- Fake photos
- Empty image placeholders
- Fake image URLs

---

# 22. 🌸 Memories

Memories work similarly to dreams.

A memory can contain:

- Title
- Description
- Images
- Optional location
- Memory date
- Creator
- Created timestamp
- Last edited timestamp

Memories are shared between the two users by default.

Both users can see and edit shared memories.

---

# 23. 📸 Memory Images

Images are optional.

A memory can be posted without any picture.

Examples:

```text
Memory
+
No picture
+
Save
```

is valid.

Or:

```text
Memory
+
Several pictures
+
Save
```

is also valid.

---

# 24. ✏️ Editing Memories

When a memory is edited:

```text
createdAt
```

must remain unchanged.

Only:

```text
updatedAt
```

changes.

Example:

```text
Created:
8 August 2026 • 3:42 PM

Last edited:
8 August 2026 • 6:10 PM
```

These values are generated automatically by the backend.

---

# 25. 🗑️ Deleting Memories

Memories must have a working delete function.

The delete action must actually remove the record from the database.

A confirmation should appear before deletion.

---

# 26. 🕐 Automatic Date & Time

Dreams and memories must automatically receive timestamps.

When created:

```text
createdAt = current server time
updatedAt = current server time
```

When edited:

```text
createdAt = unchanged
updatedAt = current server time
```

The user does NOT enter these values manually.

Prefer server/database-generated timestamps rather than trusting the client's clock.

---

# 27. 🗄️ Database

Recommended database:

```text
PostgreSQL
```

Recommended ORM:

```text
Prisma
```

The database should contain the actual application data.

Suggested entities:

```text
User
Dream
Memory
Session
OTP / OTP verification data
```

The final schema can be adjusted during implementation.

---

# 28. 👤 User Model

Conceptually:

```text
User
├── id
├── username
├── email
├── profilePicture
├── description
├── passwordHash
├── createdAt
└── updatedAt
```

Only two user records should be allowed.

---

# 29. 💗 Dream Model

Conceptually:

```text
Dream
├── id
├── title
├── description
├── creatorId
├── isPrivate
├── targetDate (optional)
├── location (optional)
├── createdAt
└── updatedAt
```

Images should be associated with the dream rather than forcing an image to exist.

---

# 30. 🌸 Memory Model

Conceptually:

```text
Memory
├── id
├── title
├── description
├── creatorId
├── memoryDate
├── location (optional)
├── createdAt
└── updatedAt
```

Images should be optional.

---

# 31. 🖼️ Image Storage

Images should NOT be stored directly inside normal text database fields.

The application should store image files using an appropriate file/object storage solution.

The database stores references to those images.

The exact storage provider can be decided during backend implementation.

Local development can use a local upload directory if appropriate.

---

# 32. 🚫 No Fake Data

This is a strict requirement.

The finished application must NOT contain:

- Fake usernames
- Fake dreams
- Fake memories
- Fake profile pictures
- Fake dates
- Fake statistics
- Fake notifications
- Fake image URLs
- Demo cards

The application should start with actual empty states.

Example:

```text
No dreams yet 🌸

Create your first dream
```

If the database contains nothing, the UI must show nothing except the proper empty-state interface.

---

# 33. 🔘 Buttons Must Work

Every visible interactive element must perform its intended action.

No decorative buttons pretending to work.

Examples:

```text
Create Dream → creates dream

Edit → opens actual editor

Save → saves actual changes

Delete → deletes actual record

Star → changes privacy

Add Image → opens real image selection

Remove Image → removes selected image

Edit Profile → updates profile

Change PIN → starts real OTP flow

Logout → destroys session
```

If a feature has not been implemented yet, its button should NOT be presented as if it works.

---

# 34. 📂 Recommended Project Structure

The final structure can evolve, but the general organization should remain clean.

Example:

```text
sakuri/
│
├── client/
│   ├── public/
│   │   ├── logo.png
│   │   └── images/
│   │       ├── morning/
│   │       │   └── background.jpg
│   │       ├── noon/
│   │       │   └── background.jpg
│   │       ├── evening/
│   │       │   └── background.jpg
│   │       └── night/
│   │           └── background.jpg
│   │
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── utils/
│       ├── types/
│       ├── styles/
│       └── ...
│
├── server/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── ...
│   └── ...
│
└── README.md
```

The exact structure can be adjusted if there is a better architecture.

---

# 35. 🛠️ Recommended Technology

Preferred stack:

## Frontend

```text
React
TypeScript
Vite
CSS
```

## Backend

```text
Node.js
Express
TypeScript
```

## Database

```text
PostgreSQL
Prisma
```

## Authentication

Secure server-side authentication/session system.

## Email

An email provider capable of sending OTP emails automatically.

## Images

Appropriate image/object storage.

## PWA

The application should be installable on Android if practical.

---

# 36. 📱 PWA / Mobile

The application should ideally behave like an installable application on Android.

Requirements:

- Responsive layout
- Mobile-friendly touch controls
- App icon using Sakuri logo
- Proper viewport
- PWA manifest
- Appropriate splash/icon configuration where supported

The web version must still work normally on laptops/desktops.

---

# 37. 🧭 Navigation

Navigation should remain simple.

Suggested:

```text
🌸 Sakuri

Home
Dreams
Memories
Profile
Settings
```

Mobile can use a compact navigation system.

Desktop can use a sidebar.

---

# 38. 🏠 Home

Home should be simple.

It can show:

```text
Dynamic greeting

Profile information

Dream summary / latest dreams

Memory summary / latest memories

Quick create buttons
```

Do not turn Home into a dashboard filled with meaningless statistics.

The focus is on dreams and memories.

---

# 39. 📄 Empty States

Every section needs a proper empty state.

Example:

```text
🌸

No dreams yet

Start adding the things you want
to experience together.

        + Create Dream
```

The empty state must be based on actual database data.

---

# 40. 🎀 UI Rules

The interface should:

- Use consistent spacing
- Use consistent border radius
- Use consistent typography
- Use responsive layouts
- Have accessible contrast
- Have clear hover/focus states
- Work with touch
- Avoid unnecessary popups
- Avoid excessive animations

Animations should be subtle.

---

# 41. ❌ Things NOT to Build

Do NOT add these unless explicitly requested later:

- Social media feed
- Followers
- Likes
- Comments
- Public accounts
- Account discovery
- Friend requests
- Chat
- Stories
- Reels
- Public sharing
- Complex notification system
- Multiple account registration
- Admin dashboard
- Fake analytics
- Fake activity
- Unnecessary gamification

Sakuri should remain small and personal.

---

# 42. 🔐 Privacy Rules

Private dreams are genuinely private.

If:

```text
Dream.isPrivate = true
```

then:

```text
creator → can view/edit
other user → cannot view/edit
```

This must be enforced server-side.

Never rely solely on:

```text
if (...) hide card
```

in React.

The backend must reject unauthorized access.

---

# 43. 🛡️ General Security

The application should follow standard security practices.

Important requirements:

- Hash PINs
- Secure authentication sessions
- Protect API routes
- Validate user input
- Validate uploaded files
- Limit image upload sizes
- Prevent unauthorized dream/memory access
- Protect OTP endpoints
- Expire OTPs
- Prevent OTP reuse
- Invalidate sessions after PIN changes
- Do not expose sensitive information to the frontend
- Do not store secrets in Git

Environment secrets should be stored in:

```text
.env
```

and excluded from Git.

---

# 44. 🧪 Development Rule

Do not consider a feature complete just because its UI exists.

A feature is complete only when:

```text
UI
 ↓
Frontend logic
 ↓
API
 ↓
Backend logic
 ↓
Database
 ↓
Real result
```

works correctly.

Example:

A Create Dream button is NOT complete if it only opens a form.

It is complete when:

```text
Form
 ↓
API request
 ↓
Backend validation
 ↓
Database insert
 ↓
Real dream appears
```

---

# 45. 🚀 Development Order

Recommended development order:

### Phase 1 — Project foundation

- Frontend setup
- Backend setup
- Database setup
- Environment configuration
- Basic project structure

### Phase 2 — Authentication

- Two accounts
- Login
- 4-digit PIN
- Sessions
- Persistent login
- Logout

### Phase 3 — OTP

- Email configuration
- OTP generation
- OTP verification
- PIN change
- Session invalidation

### Phase 4 — Profiles

- Profile display
- Username editing
- Description editing
- Profile picture upload
- Dynamic greeting

### Phase 5 — Dreams

- Create
- Read
- Edit
- Delete
- Shared dreams
- Private dreams
- Star toggle
- Timestamps
- Optional images

### Phase 6 — Memories

- Create
- Read
- Edit
- Delete
- Timestamps
- Optional images

### Phase 7 — Image handling

- Image upload
- Multiple images
- Image removal
- Image display
- Validation

### Phase 8 — UI

- Glassmorphism
- Pink/cherry theme
- Responsive layouts
- Background switching
- Logo integration
- Empty states
- Animations/polish

### Phase 9 — PWA

- Manifest
- App icon
- Mobile behavior
- Installability

### Phase 10 — Testing

Test:

- Login
- Logout
- Persistent session
- PIN change
- OTP
- Profile editing
- Dream creation
- Dream editing
- Dream deletion
- Private dreams
- Shared dreams
- Memory creation
- Memory editing
- Memory deletion
- Image upload
- Image removal
- Empty states
- Mobile
- Desktop

---

# 46. 🧠 Important Development Rule for Future Work

When working on Sakuri:

1. Read this README first.
2. Do not invent features that are not specified.
3. Do not add fake data.
4. Do not leave fake buttons.
5. Do not use placeholder images once real assets are provided.
6. Keep the UI simple.
7. Keep the application limited to two accounts.
8. Preserve existing working functionality when adding new features.
9. Tell the user the exact file location when asking them to create/edit a file.
10. Do not modify unrelated files unnecessarily.
11. Test the actual functionality after implementation.
12. Prefer completing one real module before moving to the next.

---

# 47. 📍 Important Asset Locations

The intended asset locations are:

```text
client/public/logo.png
```

and:

```text
client/public/images/morning/background.jpg
client/public/images/noon/background.jpg
client/public/images/evening/background.jpg
client/public/images/night/background.jpg
```

If the actual project structure differs, use the project's existing structure rather than blindly creating duplicate folders.

---

# 48. 🌸 Final Product Definition

Sakuri should ultimately feel like:

> **A tiny private glassmorphism cherry-blossom space shared by exactly two people.**

The application should allow those two people to:

```text
Login securely
      ↓
Stay logged in
      ↓
See their personalized greeting
      ↓
Create Dreams
      ↓
Make Dreams private with ⭐
      ↓
Create Memories
      ↓
Add optional pictures
      ↓
Edit everything they are allowed to edit
      ↓
Automatically record dates/times
      ↓
Manage their profile
      ↓
Change PIN securely through email OTP
      ↓
Logout when desired
```

Everything should be backed by real functionality.

No fake data.

No fake buttons.

No unnecessary features.

No unnecessary complexity.

Just:

# 🌸 Sakuri

# 49. 💰 Free & Accessible Technology Requirement

This is a strict requirement for Sakuri.

All technologies, libraries, tools, and services used to build and run Sakuri should be **free and easily accessible**.

## Requirements

Prefer solutions that are:

- Free to use
- Open-source when practical
- Permanently available on a free tier
- Easy for a student to set up
- Easy to maintain
- Suitable for a two-user application
- Not dependent on expensive infrastructure

Avoid services that require payment for basic Sakuri functionality.

A free trial does NOT count as a suitable free solution.

If an external service is required, prefer a provider with a reliable free tier and clearly state any free-tier limitations before integrating it.

## Development Tools

Development should use free tools such as:

- Git
- GitHub
- VS Code or another free editor
- Node.js
- npm
- React
- TypeScript
- Vite
- Express
- PostgreSQL
- Prisma

## Third-Party Services

Before adding any third-party service, verify:

1. It has a usable free tier.
2. The free tier is sufficient for two users.
3. It does not require unnecessary paid features.
4. There is no hidden requirement to upgrade for basic functionality.
5. The service is reasonably easy to configure.
6. A free alternative exists if the service becomes unsuitable.

## Cost Principle

Sakuri is a personal two-user application.

The architecture should therefore avoid unnecessary infrastructure and expensive services.

The target running cost should be:

**₹0 whenever realistically possible.**

If a feature cannot reasonably be implemented for free, explain the available free alternatives before introducing a paid dependency.

Do not silently introduce a paid service.

## No Paid Dependency Without Approval

Do not add a service, API, library, hosting provider, storage provider, email provider, or other dependency that requires payment without first informing the user.

The user must explicitly approve any paid dependency.

### Dreams. Memories. Two people. One little world.
