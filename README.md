# StudyPal Frontend 🚀

A beautiful, modern React TypeScript application for intelligent study management with notebooks, notes, flashcards, and quizzes.

## ✨ Features

### 📚 Study Management
- **Notebooks**: Organize your notes into themed notebooks
- **Notes**: Rich text notes with markdown support
- **Flashcards**: Interactive flashcards with flip animations
- **Quizzes**: AI-generated quizzes from your notes

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Beautiful Animations**: Smooth transitions and micro-interactions
- **Dark/Light Theme**: Customizable color schemes
- **Accessibility**: WCAG compliant design

### 🔐 Authentication
- **JWT Authentication**: Secure token-based authentication
- **Auto-refresh**: Automatic token refresh handling
- **Protected Routes**: Secure access to authenticated content

### 📊 Dashboard
- **Overview Cards**: Quick stats and insights
- **Recent Activity**: Track your study progress
- **Quick Actions**: Fast access to common tasks

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Toast notifications
- **Framer Motion** - Smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- StudyPal Backend API running on `http://127.0.0.1:8000`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studypal-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/          # Authentication components
│   ├── common/        # Shared components
│   ├── dashboard/     # Dashboard components
│   ├── flashcards/    # Flashcard components
│   ├── notebooks/     # Notebook components
│   ├── notes/         # Note components
│   ├── profile/       # Profile components
│   └── quizzes/       # Quiz components
├── contexts/          # React contexts
├── services/          # API services
└── index.css          # Global styles
```

## 🔧 Configuration

### API Endpoint

The application is configured to connect to the StudyPal backend API. Update the base URL in `src/services/api.ts` if needed:

```typescript
private baseURL = 'http://127.0.0.1:8000/api';
```

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://127.0.0.1:8000/api
```

## 📱 Features Overview

### Authentication
- User registration and login
- JWT token management
- Automatic token refresh
- Protected routes

### Dashboard
- Overview statistics
- Quick action buttons
- Recent activity feed
- Study tips and guidance

### Notebooks
- Create, edit, and delete notebooks
- Search functionality
- Beautiful card layout
- Notebook organization

### Notes
- Rich text editor
- Markdown support
- Note organization by notebook
- Search and filter

### Flashcards
- Interactive flip animations
- Study mode with progress tracking
- Create flashcards from notes
- Spaced repetition learning

### Quizzes
- AI-generated quizzes from notes
- Multiple choice questions
- Score tracking
- Detailed results and explanations

### Profile
- User information management
- Account settings
- Study statistics
- Security settings

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (`#0ea5e9` to `#0284c7`)
- **Secondary**: Purple gradient (`#d946ef` to `#c026d3`)
- **Success**: Green (`#22c55e`)
- **Warning**: Yellow (`#f59e0b`)
- **Danger**: Red (`#ef4444`)

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono (for code)

### Components
- **Cards**: Consistent card design with shadows
- **Buttons**: Primary, secondary, and danger variants
- **Forms**: Styled input fields with focus states
- **Modals**: Overlay modals with backdrop blur

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Token Refresh**: Automatic token renewal
- **Protected Routes**: Route-level security
- **Input Validation**: Client-side form validation
- **XSS Protection**: Sanitized user inputs

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: 1024px and above
- **Tablet**: 768px to 1023px
- **Mobile**: 320px to 767px

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Install Vercel CLI
   ```bash
   npm i -g vercel
   ```

2. Deploy
   ```bash
   vercel
   ```

### Deploy to Netlify

1. Build the project
   ```bash
   npm run build
   ```

2. Upload the `build` folder to Netlify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify the backend API is running
3. Ensure all dependencies are installed
4. Check the network tab for API calls

## 🔮 Future Features

- [ ] Dark mode toggle
- [ ] Offline support
- [ ] Export notes to PDF
- [ ] Collaborative study groups
- [ ] Study analytics and insights
- [ ] Mobile app (React Native)
- [ ] Voice notes
- [ ] Image upload support

---

Built with ❤️ for students everywhere 