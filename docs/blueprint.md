# **App Name**: Ubox POS

## Core Features:

- Order Management: Record and manage orders with different roles (waiter, bartender, cashier). Includes printing tickets with unique QR codes.
- Inventory Control (Barman): Allows bartender to track beverage inventory, record expenses/income, and view waiter rankings.
- Sales Reporting: Generate comprehensive sales reports with filters. Track sales by staff and identify top performers. The LLM analyzes the trends and produces written insights as a tool for the owner.
- User Management: Multi-user administration with hierarchical roles (Boss, Super Admin, Admin, Waiter, Barman, Cashier, Support).
- License and Subscription Management: Manage licenses, plans, and subscriptions, including free trials and renewals. Stripe integration for payments.
- Cloud Synchronization: Synchronize data between cloud (Firebase) and local desktop application for offline functionality.
- Secure Authentication and Authorization: Implement Firebase Authentication with multi-factor authentication (MFA) to ensure secure user access based on roles. Use Firebase to authorize various levels of administrative access. Integrates the other modules to Firestore securely and efficiently.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey trust, security, and reliability, essential for a financial application.
- Background color: Light gray (#F0F2F5), offering a clean and professional backdrop without distracting from the content.
- Accent color: Soft Purple (#9575CD), providing a subtle highlight for interactive elements.
- Body and headline font: 'Inter' for a modern, machined, objective, neutral feel; well-suited for both headlines and body text.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use clear and consistent icons to represent menu items, actions, and status indicators.
- Design a responsive layout that adapts to both web and desktop environments, ensuring a consistent user experience across devices.