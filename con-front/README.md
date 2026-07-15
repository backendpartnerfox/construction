# Construction Management Frontend

A modern React.js application for construction project management with authentication and project tracking capabilities.

## 🚀 Features

- **User Authentication**: Login, Register, Forgot Password
- **Dashboard**: Project overview with statistics and progress tracking
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Modern UI**: Clean and professional construction-themed design
- **API Integration**: Ready for backend API connection
- **Protected Routes**: Secure access to authenticated areas

## 📦 Tech Stack

- **React 18**: Modern React with hooks
- **React Router 6**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **React Hook Form**: Form validation and handling
- **React Hot Toast**: Toast notifications
- **Lucide React**: Beautiful icons

## 🛠️ Installation & Setup

### Prerequisites

Make sure you have Node.js (version 14 or later) and npm installed on your system.

### 1. Install Dependencies

```bash
cd C:\Users\fs1.PartnerFoxACER\Documents\Projects\Construction\Source\con-front
npm install
```

### 2. Start Development Server

```bash
npm start
```

The application will run on `http://localhost:8989`

### 3. Build for Production

```bash
npm run build
```

## 🔧 Configuration

### API Configuration

The application is configured to connect to your backend API at `http://localhost:8000/api`. You can modify this in:

- `src/services/api.js` - Change the `API_BASE_URL` constant
- `package.json` - Update the proxy setting if needed

### Port Configuration

The development server runs on port **8989** as specified. You can change this in:

- `package.json` - Modify the start script: `"start": "PORT=8989 react-scripts start"`

## 📁 Project Structure

```
src/
├── components/         # Reusable components
│   └── ProtectedRoute.js
├── pages/             # Page components
│   ├── Login.js
│   ├── Register.js
│   ├── ForgotPassword.js
│   └── Dashboard.js
├── services/          # API services
│   └── api.js
├── utils/            # Utilities and contexts
│   └── AuthContext.js
├── App.js            # Main app component
├── index.js          # Entry point
└── index.css         # Global styles
```

## 🎨 UI Features

### Authentication Pages
- **Login**: Email/password login with remember me option
- **Register**: Complete user registration with role selection
- **Forgot Password**: Password recovery functionality

### Dashboard
- **Statistics Cards**: Total projects, active projects, completed projects, team members
- **Project Grid**: Visual project cards with progress bars
- **Status Indicators**: Color-coded project status icons
- **Search & Filter**: Project search functionality
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🔐 Authentication Flow

1. **Login**: Users authenticate with email/password
2. **Token Storage**: JWT tokens stored in localStorage
3. **Protected Routes**: Automatic redirect to login for unauthenticated users
4. **Auto Logout**: Automatic logout on token expiration
5. **Remember Me**: Optional persistent login

## 🌐 API Integration

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/forgot-password` - Password reset

### Project Endpoints
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users

## 🎯 Login Credentials

Use your backend username and password:
- **Username**: (your backend username)
- **Password**: (your backend password)

The app will automatically send:
- User's IP address
- Browser user agent
- Username and password

## 🚀 Getting Started

1. **Clone and Setup**:
   ```bash
   cd C:\Users\fs1.PartnerFoxACER\Documents\Projects\Construction\Source\con-front
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:8989`

4. **Test Login**:
   Use the demo credentials or register a new account

## 🔧 Development

### Available Scripts

- `npm start` - Start development server (port 8989)
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not recommended)

### Customization

#### Colors
Modify construction-themed colors in `tailwind.config.js`:
```javascript
construction: {
  orange: '#ff6b35',
  yellow: '#f7931e', 
  blue: '#004e89',
  green: '#1a936f',
  gray: '#6c757d'
}
```

#### API URL
Change API base URL in `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

## 📱 Responsive Design

The application is fully responsive and includes:
- **Desktop**: Full-featured layout with sidebar navigation
- **Tablet**: Adapted layout with collapsible navigation
- **Mobile**: Touch-friendly interface with bottom navigation

## 🧪 Testing

The app includes testing setup with:
- Jest for unit testing
- React Testing Library for component testing
- Test files should be named `*.test.js` or placed in `__tests__` folders

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deploy to Web Server
1. Build the application
2. Copy the `build` folder contents to your web server
3. Configure server for single-page application routing

### Environment Variables
Create a `.env` file for environment-specific configurations:
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_APP_NAME=Construction Manager
```

## 🛠️ Backend Requirements

Your backend API should support:
- JWT authentication
- CORS enabled for frontend domain
- RESTful API endpoints as documented above
- Proper error handling and status codes

## 📄 License

This project is created for construction management purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions about this construction management application, please check the documentation or contact the development team.
