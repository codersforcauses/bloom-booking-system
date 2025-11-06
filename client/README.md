# Frontend server

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). It includes a number of other libraries:

- Next.js App Router
- Tailwind for styling
- Tanstack Query for state management and data fetching
- Axios for data fetching
- shadcn/ui for components
- lucide for icons

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

# Styling Conventions

This outlines the convention for this project as well as generally good practices.

## General

- Use arrow functions over the `function` keyword (except for React components).
- Use `async`/`await` over `.then()` for promises (data fetching, etc...).

## CSS

- Use Tailwind utility classes over custom CSS. If you find yourself writing a lot of raw CSS, you're probably doing something wrong.
- Keep margins and padding consistent. e.g. I like `p-2` and `m-2` for most things, but `p-4` and `m-4` for larger things like cards.
- Prefer flexboxes. You can do almost everything with them and margins/padding/gaps! If there was a single thing I could make you do during this project period, it's [Flexbox Froggy](https://flexboxfroggy.com/).

## `src/` (Next.js)

- All file and folder names are in `lowercase`. Avoid multiple word api endpoints where possible. Favour creating extra folders.
- Use functional components over class components for **components** and **pages**. They should be defined using `function` and should be exported as `default`. Use `(arrow) => functions()` everywhere else.

```tsx
// DO THIS
export default function MyComponent() {
  return <div>My Component</div>;
}

// NOT THIS
export default class MyComponent extends React.Component {
  render() {
    return <div>My Component</div>;
  }
}
```

```tsx
// DO THIS
export default function MyComponent() {
  return <div>My Component</div>;
}

// NOT THIS
const MyComponent = () => {
  return <div>My Component</div>;
};
export default MyComponent;
```

### `src/components/`

- Use shadcn/ui to create components
- Try to reuse components as much as possible. If you find yourself copying and pasting code, it's probably time to refactor. If you didn't make the component, make sure to let them know or ask them for help.
- Folders should use PascalCase while files should use kebab-case. Exported component names should be in `<PascalCase />`.
- Unless appropriate to do so, avoid placing a single component file in the root. (E.g. it might be appropriate if the component is a generic UI element used in many other components). Prefer creating a subfolder for it. Additionally, prefer using `index.tsx` for the main component in the subfolder. E.g. rather than `Footer/footer.tsx`, do `Footer/index.tsx`.

> If you need to break a component into smaller components, create a folder with the same name as the component and create the smaller components in there. For example, if you have a component called `mycomponent.tsx` and you need to break it into smaller components, create a folder called `mycomponent` and create the smaller components in there. The main component should be called `index.tsx` (still exported as `MyComponent`).

### `src/pages/` and other subfolders of `src/` except `src/components/`

- Both files and folders should use kebab-case.
- Any routes (including API routes) should use kebab-case.

## `tests/`

- It's nice to have to test each `page.tsx`
- To enforce style, please mirror the structure of the `src/` directory here. e.g. `tests/app/dashboard/page.test.tsx`
