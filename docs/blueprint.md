# **App Name**: VogueCraft

## Core Features:

- Product Discovery & Details: Browse a comprehensive clothing catalog, explore product categories, view individual product pages with multiple images, size/color variations, and real-time stock levels powered by Supabase. Utilizes SSG for static pages and SSR for product details.
- Shopping Cart Management: Users can add, remove, and update quantities of items in their shopping cart. The cart state is dynamically managed using Client-Side Rendering (CSR) and persisted in Supabase for logged-in users.
- User Accounts & Authentication: Secure user registration, login, password recovery, and management of user profiles are handled using CSR and Supabase for authentication and data storage.
- Secure Checkout Process: A streamlined checkout flow for reviewing orders, calculating shipping costs, and confirming purchases. This process uses CSR for dynamic interactions and stores order information in Supabase.
- Advanced Search & Filtering: Enables users to search for products and apply dynamic filters (e.g., by category, size, color) to refine results. Initial search results and filtered pages utilize SSR for optimal SEO, with dynamic filter updates handled by CSR.
- AI Style Recommender Tool: An AI-powered tool that suggests personalized clothing recommendations or complete outfit ideas based on user browsing history, expressed preferences, or seasonal trends. Recommendations leverage Supabase product data.

## Style Guidelines:

- Primary color: Deep Indigo (#6129A3). This vibrant yet sophisticated purple hue conveys modernity and creativity, while ensuring strong contrast against lighter elements, fitting a professional and high-fashion aesthetic.
- Background color: Near-White (#F9F8FC). A very light, desaturated version of the primary's hue provides a clean, spacious canvas that enhances readability and keeps the focus on product imagery, maintaining an intuitive user experience.
- Accent color: Dynamic Blue (#3795EB). An energetic and contrasting blue hue is chosen for interactive elements, call-to-action buttons, and key highlights. Its brightness and saturation create a clear visual hierarchy, drawing attention where needed without clashing with the primary palette.
- Headlines will use 'Space Grotesk', a proportional sans-serif with a modern, techy feel, suitable for strong headings. Body text and longer descriptions will use 'Inter', a clean grotesque-style sans-serif, ensuring readability and a contemporary, objective look for the main content.
- Utilize minimalist, crisp line-art icons that complement the modern and clean design aesthetic. Icons should be clear and intuitive, contributing to a seamless user experience across all devices.
- A mobile-first, responsive grid system ensures the layout adapts seamlessly to various screen sizes. Focus on ample whitespace and clear delineation of content sections for an intuitive user flow, featuring responsive product cards and dynamic galleries.
- Subtle, fluid animations and transitions will be implemented for navigation, product interactions (e.g., adding to cart), and page transitions to enhance the perceived performance and polish of the application, utilizing libraries like GSAP or ANIME.JS.