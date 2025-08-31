# Queens Hotel - Authentication System

This project implements a modern authentication system for the Queens Hotel booking application with a beautiful UI and comprehensive functionality.

## Features

### 🎨 Modern UI Design
- **Responsive Design**: Works perfectly on all devices
- **Gradient Backgrounds**: Beautiful visual appeal
- **Smooth Animations**: CSS transitions and hover effects
- **Card-based Layout**: Clean and organized form presentation
- **Icon Integration**: Font Awesome icons throughout the interface

### 🔐 Authentication Features
- **Sign In Form**: Email and password authentication
- **Sign Up Form**: Complete user registration with validation
- **Form Switching**: Seamless transition between sign in and sign up
- **Password Strength**: Real-time password strength indicator
- **Input Validation**: Comprehensive form validation with error messages
- **Remember Me**: Option to stay signed in
- **Social Authentication**: Facebook and Google sign-in buttons (placeholder)
- **Access Control**: Route protection for sensitive pages (booking.html, confirmation.html)
- **Automatic Redirects**: Unauthenticated users are redirected to login page

### 🧭 Navigation
- **Header Navigation**: Consistent with the main site
- **Account Dropdown**: Easy access to sign in/sign up from header
- **Breadcrumb Navigation**: Clear page hierarchy
- **Responsive Menu**: Mobile-friendly navigation

### 📱 Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Responsive layout for tablets
- **Desktop Experience**: Full-featured desktop interface

## File Structure

```
Hotel Booking/
├── login.html              # Main authentication page
├── css/
│   └── auth.css           # Authentication-specific styles
├── js/
│   ├── auth.js            # Authentication logic and API calls
│   ├── route-guard.js     # Access control and route protection
│   └── custom-nav.js      # Navigation and authentication state management
└── README.md              # This documentation
```

## Setup Instructions

### 1. Frontend Setup
The authentication system is already integrated into the project. All necessary files are created and linked.

### 2. Backend Configuration (.NET)

#### API Endpoints Required

Your .NET backend should implement these endpoints:

**Sign In Endpoint:**
```
POST /api/auth/signin
Content-Type: application/json

Request Body:
{
    "email": "user@example.com",
    "password": "userpassword",
    "rememberMe": true
}

Response:
{
    "success": true,
    "token": "jwt_token_here",
    "message": "Sign in successful"
}
```

**Sign Up Endpoint:**
```
POST /api/auth/signup
Content-Type: application/json

Request Body:
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "SecurePassword123!"
}

Response:
{
    "success": true,
    "message": "Account created successfully"
}
```

#### Update API URL

In `js/auth.js`, update the `apiBaseUrl` property:

```javascript
this.apiBaseUrl = 'https://your-actual-api-domain.com/api';
```

### 3. Database Schema

Your .NET backend should have a users table with these fields:

```sql
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Phone NVARCHAR(20),
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    LastLoginAt DATETIME2,
    IsActive BIT DEFAULT 1
);
```

## Usage

### For Customers
1. **Click "Book Now"** on any page → Redirects to sign-in page
2. **Choose to Sign In** or **Create Account**
3. **Fill out the form** with validation feedback
4. **Successfully authenticate** → Redirected to room availability page

### For Developers
1. **Form Switching**: Use `showSignInForm()` and `showSignUpForm()` methods
2. **Validation**: Built-in validation for all form fields
3. **API Integration**: Update the `apiBaseUrl` in `auth.js`
4. **Customization**: Modify `auth.css` for styling changes

## Customization

### Styling
- **Colors**: Update CSS variables in `auth.css`
- **Layout**: Modify the card structure in `login.html`
- **Animations**: Adjust CSS transitions and keyframes

### Functionality
- **Validation Rules**: Modify validation methods in `auth.js`
- **API Endpoints**: Update the fetch calls for your backend
- **Social Auth**: Implement actual social authentication logic

## Access Control

The system implements route protection to control access to different pages:

### Protected Routes (Require Authentication)
- **`booking.html`**: Room booking form - only accessible to logged-in users
- **`confirmation.html`**: Booking confirmation - only accessible to logged-in users

### Public Routes (Accessible to All)
- **`index.html`**: Home page
- **`availability.html`**: Room availability display
- **`room-select.html`**: Room selection interface
- **`aboutus1.html`**: About us page
- **`contact.html`**: Contact information

### How It Works
1. **Route Guard**: Automatically checks authentication status when accessing protected pages
2. **Automatic Redirects**: Unauthenticated users are redirected to the login page
3. **Post-Login Navigation**: After successful login, users are redirected to their intended destination
4. **Cross-Tab Synchronization**: Authentication state is maintained across all browser tabs/windows

## Security Features

- **Password Strength**: Enforces strong password requirements
- **Input Sanitization**: Validates all user inputs
- **Token Management**: Secure token storage and expiration
- **Form Validation**: Client-side validation with server-side verification
- **Route Protection**: Prevents unauthorized access to sensitive pages

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **IE Support**: Limited support for Internet Explorer 11+

## Troubleshooting

### Common Issues

1. **Forms not switching**: Check if `auth.js` is properly loaded
2. **Validation not working**: Ensure all form IDs match those in `auth.js`
3. **API calls failing**: Verify the `apiBaseUrl` is correct
4. **Styling issues**: Check if `auth.css` is properly linked

### Debug Mode

Enable console logging by adding this to `auth.js`:

```javascript
// Add at the top of the AuthManager class
constructor() {
    this.debug = true; // Enable debug mode
    // ... rest of constructor
}
```

## API Response Format

All API responses should follow this format:

```json
{
    "success": boolean,
    "message": "string",
    "token": "string (for sign in)",
    "data": {} // Optional additional data
}
```

## Error Handling

The system handles various error scenarios:
- **Network errors**: Connection issues with the backend
- **Validation errors**: Form field validation failures
- **Authentication errors**: Invalid credentials or account issues
- **Server errors**: Backend processing failures

## Route Guard Implementation

The access control system is implemented using a `RouteGuard` class that:

### Core Functionality
- **Automatic Detection**: Identifies protected vs. public routes
- **Authentication Checks**: Verifies user login status before page access
- **Smart Redirects**: Stores intended destination and redirects after login
- **Event Handling**: Listens for authentication state changes across tabs

### Integration Points
- **Protected Pages**: Include `route-guard.js` script for automatic protection
- **Navigation Updates**: Dynamic display of user info/logout buttons
- **Cross-Tab Sync**: Real-time authentication state synchronization

### Configuration
```javascript
// Protected routes (require authentication)
this.protectedRoutes = [
    'booking.html',
    'confirmation.html'
];

// Public routes (accessible to all)
this.publicRoutes = [
    'index.html',
    'availability.html',
    'room-select.html',
    'aboutus1.html',
    'contact.html'
];
```

## Future Enhancements

- **Two-Factor Authentication**: SMS or email verification
- **Password Reset**: Forgot password functionality
- **Email Verification**: Account activation via email
- **Profile Management**: User profile editing
- **Booking History**: Past booking records
- **Preferences**: User preferences and settings
- **Role-Based Access**: Different permission levels for different user types
- **Session Management**: Advanced session handling and timeout features

## Support

For technical support or customization requests, please refer to the development team or create an issue in the project repository.

---

**Note**: This authentication system is designed to work seamlessly with your existing .NET backend. Make sure to implement the required API endpoints and database schema before testing the frontend functionality.
