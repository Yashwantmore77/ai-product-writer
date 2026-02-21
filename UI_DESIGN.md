# AI Product Description Generator - UI Design Specification

## **MAIN GENERATOR PAGE UI DESIGN**

**Overall Style:**
- Dark futuristic theme with deep navy/purple gradient background (#0a0e27 to #1a1f3a)
- Glass morphism aesthetic (frosted glass cards with blur effects)
- Floating animated gradient orbs in background (purple and blue, heavily blurred, slowly moving)
- Clean, spacious layout with lots of breathing room

**Header (Top Bar):**
- Dark translucent glass bar spanning full width
- Left side: Logo icon (gradient purple-to-blue circle with sparkle/pen icon) + "DescribeAI" or your app name in white, bold
- Subtitle below logo: "AI Product Description Generator"
- Right side: Credit counter pill (dark glass background, yellow lightning bolt icon, "8/10 descriptions left" text)

**Main Hero Section:**
- Centered large heading: "Generate Compelling Product Descriptions" in massive white text with subtle gradient (white to light purple)
- Subheading below: "AI-powered descriptions for Amazon, eBay, and Shopify in seconds" in gray

**Layout: Two-Column Split**

**LEFT COLUMN (Input Area):**

1. **Platform Selector Card:**
   - Glass morphism card with subtle border
   - Label: "SELECT PLATFORM" in small caps, gray
   - Three pill-shaped buttons side by side:
     - Amazon (orange accent when selected) - "Product description + features"
     - eBay (red accent when selected) - "Item description format"
     - Shopify (green accent when selected) - "SEO-optimized copy"
   - Each button shows platform name + format type below in small text

2. **Product Input Card:**
   - Glass morphism card below platform selector
   - Label: "PRODUCT INFORMATION" in small caps, gray
   - Multiple input fields with dark semi-transparent backgrounds:
     - **Product Name** field (single line)
     - **Category/Type** field (single line) 
     - **Key Features** text area (3-4 lines) - placeholder: "e.g., waterproof, 32oz capacity, BPA-free"
     - **Materials** field (single line) - placeholder: "e.g., stainless steel, silicone"
     - **Dimensions/Size** field (single line) - optional
     - **Target Audience** field (single line) - optional, placeholder: "e.g., fitness enthusiasts, outdoor adventurers"
   - Small info icon with helper text below: "More details = better descriptions"

3. **Tone/Style Selector (Optional):**
   - Small row of style chips: "Professional" | "Casual" | "Luxury" | "Fun"
   - One selected with colored outline

4. **Generate Button:**
   - Full-width button below cards
   - Vibrant gradient (purple to blue)
   - "Generate Description" text with sparkle icon
   - Rounded corners, subtle glow effect

**RIGHT COLUMN (Output Area):**

**Before Generation:**
- Empty state with large faded document/text icon in center
- Gray text: "Your AI-generated description will appear here"
- Lighter gray subtext: "Fill in product details and click Generate"

**After Generation:**
- Glass morphism card with colored top border (matching selected platform color)
- Top right: Small action buttons (Copy icon, Download icon, Regenerate icon) with glass button style
- Platform-specific formatted output:

**For Amazon:**
- **Product Title** section (label in orange)
- **Key Features/Bullet Points** section (5 bullets, each in dark box)
- **Product Description** section (2-3 paragraph format)

**For eBay:**
- **Item Title** section (label in red)
- **Item Description** section (HTML-formatted, longer narrative style)
- **Item Specifics** section (condition, features list)

**For Shopify:**
- **Product Title** section (label in green)
- **Short Description** section (meta description for SEO)
- **Full Product Description** section (formatted with headings, benefits-focused)
- **SEO Keywords** shown in small pills at bottom

**Character/Word Count Display:**
- Small counter at bottom of each section: "247 characters" or "156 words"
- Green if within limits, yellow if approaching limit

**Bottom Banner:**
- Full-width purple-tinted glass card
- Sparkle icon on left
- Text: "Pro tip: Include unique selling points and target customer pain points for more persuasive descriptions"

---

## **LOGIN PAGE UI DESIGN**

**Overall Style:**
- Same dark gradient background as main page
- Large floating gradient orbs (purple, blue, gold) heavily blurred
- Everything centered vertically and horizontally

**Centered Content:**

1. **Logo Section:**
   - Large gradient square with rounded corners (purple to blue gradient)
   - White pen/sparkle/document icon centered inside
   - Pulsing glow animation
   - "DescribeAI" (or your app name) text below in large white bold font with gradient effect
   - Subtext: "AI Product Description Generator for Online Sellers" in gray

2. **Login Card:**
   - Large glass morphism card with rounded corners
   - Heading: "Welcome back" in white, bold
   - Subheading: "Sign in to start generating descriptions" in gray

3. **Google Sign In Button:**
   - Full-width button inside card
   - Light glass background (semi-transparent white)
   - Official Google logo (4 colors) on left
   - "Continue with Google" text in center
   - Arrow icon on right
   - Subtle shimmer effect on hover

4. **Divider:**
   - Thin gray line with "FREE TO START" text in center

5. **Features List:**
   - 3 rows showing features
   - Each row: colored icon box (purple tinted) + text
   - ✨ "10 free descriptions per month"
   - 🎯 "Amazon, eBay & Shopify formats"
   - ⚡ "Generated in under 10 seconds"

6. **Footer Text:**
   - Small gray text: "By signing in, you agree to our Terms of Service and Privacy Policy"
   - Links in light purple

7. **Social Proof Card:**
   - Purple-tinted glass card below main content
   - Shopping bag/storefront icon in gradient circle on left
   - "Join 1,200+ online sellers using DescribeAI" in white
   - "50,000+ product descriptions generated" in gray below

---

## **DASHBOARD/HOME PAGE UI DESIGN** (After Login)

**Header:**
- Same as generator page
- Add: User profile circle on far right with dropdown menu

**Main Content:**

1. **Welcome Banner:**
   - Glass card spanning top
   - "Welcome back, [Name]!" in large text
   - Usage stats: "You've generated 47 descriptions this month"

2. **Quick Actions Section:**
   - Three large glass cards in a row:
     - **New Description** - sparkle icon, "Generate new product description" button
     - **Recent Descriptions** - clock icon, "View your last 10 generations"
     - **Upgrade** - rocket icon, "Unlock unlimited generations"

3. **Recent Generations List:**
   - Table/list view with glass card background
   - Columns: Product Name | Platform | Date | Actions
   - Each row shows: product title snippet, platform badge (colored), date, Copy/View/Delete icons

4. **Stats Cards Row:**
   - Three small stat cards:
     - "47 Descriptions" - this month count
     - "3 Credits Left" - remaining in free tier
     - "15min Saved" - time saved estimate

---

## **COLOR PALETTE**

- **Background:** Deep navy (#0a0e27) to dark purple-blue (#1a1f3a)
- **Primary accent:** Purple (#8a2be2) to blue (#4169e1) gradients
- **Platform colors:** 
  - Amazon orange (#FF9900)
  - eBay red (#E53238)
  - Shopify green (#96BF48)
- **Text:**
  - Primary: White (#e8e6f0)
  - Secondary: Light gray (#9ca3af)
  - Tertiary: Darker gray (#666)
- **Glass cards:** Semi-transparent white (3-5% opacity) with white borders (8-10% opacity)
- **Dark inputs:** Black with 30% opacity, white text
- **Success green:** #4ade80
- **Warning yellow:** #fbbf24

---

## **Key Design Principles**

- This is clearly a **description generator**, not a full listing tool
- Input focuses on product details (name, features, materials)
- Output shows formatted descriptions tailored to each platform
- Emphasizes copywriting/content generation, not just data
- Character counts and SEO keywords are highlighted
