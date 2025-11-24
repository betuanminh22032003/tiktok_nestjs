# TikTok Frontend Components

This directory contains all reusable components following atomic design principles.

## Component Structure

### 📦 Atoms (`atoms/`)

Basic building blocks that can't be broken down further:

- **Avatar** - User profile picture with online status and verification badge
- **IconButton** - Reusable icon button with variants and badges
- **NumberFormatter** - Formats large numbers (e.g., 1.2M, 15K)
- **TextCaption** - Caption text with hashtag and mention highlighting
- **VideoTag** - Tag component for video metadata

### 🧩 Molecules (`molecules/`)

Combinations of atoms that form functional units:

- **UserBadge** - User information display (avatar + name)
- **FollowButton** - Follow/Unfollow button with states
- **ActionGroup** - Video interaction buttons (like, comment, share)
- **SearchInput** - Search bar with auto-complete support

### 🎨 Organisms (`organisms/`)

Complex components built from molecules and atoms:

- **VideoPlayer** - Full-featured video player with controls
- **VideoCard** - Complete video card for feed
- **FeedScroller** - Infinite scroll video feed
- **CommentDrawer** - Comments drawer with replies

### 🏗️ Layout (`layout/`)

Layout components for page structure:

- **HeaderLayout** - Top navigation header
- **SidebarLayout** - Desktop sidebar navigation
- **BottomNav** - Mobile bottom navigation

## Usage Examples

### Basic Component Import

```tsx
import { Avatar, IconButton } from '@/components/atoms';
import { UserBadge, FollowButton } from '@/components/molecules';
import { VideoCard, FeedScroller } from '@/components/organisms';
import { HeaderLayout, SidebarLayout } from '@/components/layout';
```

### Using Avatar

```tsx
<Avatar
  src="https://example.com/avatar.jpg"
  alt="User Name"
  size="md"
  online={true}
  verified={true}
/>
```

### Using VideoCard

```tsx
<VideoCard
  video={videoData}
  onLike={() => handleLike(video.id)}
  onComment={() => handleComment(video.id)}
  onShare={() => handleShare(video.id)}
/>
```

## Styling

All components use Tailwind CSS with custom theme configuration:

- Primary color: `#fe2c55` (TikTok pink)
- Dark mode support with `dark:` prefix
- Custom animations and transitions
- Responsive design with mobile-first approach

## Features

✅ TypeScript support with full type definitions
✅ Dark mode support
✅ Responsive design (mobile, tablet, desktop)
✅ Accessibility features (ARIA labels, keyboard navigation)
✅ Animation and transitions
✅ Loading states
✅ Error handling
✅ Performance optimized

## Development Guidelines

1. **Component Naming**: Use PascalCase for components
2. **Props Interface**: Export props interface with `Props` suffix
3. **Default Export**: Each component should have a default export
4. **Styling**: Use Tailwind CSS classes, avoid inline styles
5. **Accessibility**: Include ARIA labels and keyboard support
6. **Responsive**: Design mobile-first, then add desktop features

## File Structure

```
components/
├── atoms/
│   ├── Avatar.tsx
│   ├── IconButton.tsx
│   └── index.ts
├── molecules/
│   ├── UserBadge.tsx
│   ├── FollowButton.tsx
│   └── index.ts
├── organisms/
│   ├── VideoCard.tsx
│   ├── FeedScroller.tsx
│   └── index.ts
└── layout/
    ├── HeaderLayout.tsx
    ├── SidebarLayout.tsx
    └── index.ts
```

## Contributing

When adding new components:

1. Place them in the appropriate category (atoms/molecules/organisms/layout)
2. Export the component and its props type
3. Add the export to the category's `index.ts` file
4. Update this README with usage examples
5. Ensure TypeScript types are properly defined
6. Test in both light and dark modes
7. Verify responsive behavior on all screen sizes
