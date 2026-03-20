# 🫧 Messy

**Visualize the Beautiful Mess of Your Subscriptions**

Messy is an interactive 2D physics playground built to help users "feel" their monthly subscription burn. Instead of rigid spreadsheets, Messy transforms your financial data into a dynamic, zero-gravity environment where every subscription is a physical object with its own weight, momentum, and impact.

![Messy Visualization](public/logo-preview.png) *(Note: Add your own screenshot here)*

## ✨ Key Features

- **Zero-Gravity Physics**: Subscriptions float freely in a frictionless environment, creating a "smooth as glass" interactive experience.
- **Financial Weight (Mass Logic)**: Higher-priced subscriptions have greater physical mass. They are harder to push, slower to accelerate, and carry more momentum—simulating the true "weight" of your expenses.
- **High-Impact Visuals**: 
  - **Streak Sparks**: High-velocity collisions generate tapered sparks with "hot cores" that fade over time.
  - **Grid Warping**: The background grid dynamically warps around your cursor and active bubbles.
  - **Reactive UI**: Modern, glassmorphic header and forms using Framer Motion.
- **Interactive Management**: Click a bubble to select it, see its details, or "pop" it to immediately reduce your monthly burn.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Physics Engine**: [Matter.js](https://brm.io/matter-js/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

First, clone the repository and install dependencies:

```bash
npm install
# or
yarn install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧠 Physics Implementation Details

### Mass-Price Mapping
We use a custom mapping function to translate subscription price into Matter.js mass:
`mass = 1 + (price / 2000)`
This ensures that a Rp 200.000 subscription feels significantly heavier and more "stubborn" than a Rp 20.000 one.

### Drag & Friction
To achieve the "glass-like" feel, the engine is configured with:
- `engine.gravity.y = 0`
- `body.friction = 0`
- `body.frictionAir = 0.005` (Slight air resistance to prevent infinite speed)
- `body.restitution = 0.9` (High bounciness)

---

Developed with ❤️ to make personal finance a bit more "messy" and a lot more fun.
