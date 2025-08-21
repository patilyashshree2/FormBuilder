# Custom Form Builder with Live Analytics

A full-stack form builder application with real-time analytics, built with Next.js, Go Fiber, and MongoDB. This comprehensive demo showcases modern web development practices with a focus on user experience, security, and real-time data visualization.

## 🚀 Features Overview

### 🎨 Form Building & Management
- **Drag & Drop Interface**: Intuitive form builder with reorderable fields
- **Multiple Field Types**: Text, single choice, multi-select, and rating fields
- **Conditional Logic**: Show/hide fields based on other field values
- **Draft/Publish Workflow**: Save drafts and publish when ready
- **Form Validation**: Client and server-side validation with detailed error messages
- **PII Field Protection**: Mark fields as PII with special handling in analytics

### 📊 Advanced Analytics & Insights
- **Real-time Updates**: Live analytics via WebSocket connections
- **Response Trends**: 7-day trend visualization with interactive charts
- **Field-level Analytics**: Detailed breakdown of responses per field
- **Completion Rates**: Track form completion and abandonment
- **Skip Analysis**: Identify most frequently skipped fields
- **Average Ratings**: Automatic calculation for rating fields
- **PII Privacy Protection**: PII fields excluded from analytics dashboard

### 🔐 Security & Authentication
- **JWT Authentication**: Secure user registration and login
- **Password Hashing**: bcrypt encryption for user passwords
- **Protected Routes**: Form management requires authentication
- **Public Sharing**: Anonymous form submissions without login
- **CORS Configuration**: Secure cross-origin resource sharing

### 📱 User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Mode Support**: System-aware theme switching
- **Loading States**: Smooth loading indicators and transitions
- **Error Handling**: Comprehensive error messages and recovery
- **Form Preview**: Preview forms before publishing
- **Success Feedback**: Clear confirmation messages

### 📈 Data Management
- **CSV Export**: Download response data for external analysis
- **Real-time Sync**: Instant updates across all connected clients
- **Data Validation**: Comprehensive input validation and sanitization
- **MongoDB Integration**: Scalable document-based storage

## 🛠 Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.io Client**: Real-time WebSocket communication
- **React Hooks**: Modern state management

### Backend
- **Go Fiber**: High-performance web framework
- **MongoDB**: Document database with Go driver
- **JWT**: JSON Web Token authentication
- **WebSocket**: Real-time bidirectional communication
- **bcrypt**: Password hashing and security

### Infrastructure
- **CORS**: Cross-origin resource sharing
- **Environment Configuration**: Flexible deployment settings
- **Health Checks**: Application monitoring endpoints

## 📋 Prerequisites

Ensure you have the following installed:
- **Node.js 18+** - JavaScript runtime
- **Go 1.22+** - Backend language
- **MongoDB 6+** - Database (local installation or MongoDB Atlas)

## ⚙️ Environment Setup

### Backend Configuration
Create `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=formbuilder
PORT=8080
JWT_SECRET=your-super-secure-jwt-secret-key
ALLOW_ORIGIN=http://localhost:3000
```

### Frontend Configuration
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## 🚀 Quick Start

### 1. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (update MONGO_URI in backend/.env)
```

### 2. Run Backend
```bash
cd backend
go mod tidy
go run main.go
```
Backend will start on `http://localhost:8080`

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:3000`

## 📖 Usage Guide

### Creating Your First Form

1. **Register/Login**: Create an account at `http://localhost:3000`
2. **Build Form**: 
   - Add fields using the intuitive interface
   - Configure field types (text, choice, rating)
   - Set up conditional logic if needed
   - Mark sensitive fields as PII
3. **Save Draft**: Save your work in progress
4. **Preview**: Test your form before publishing
5. **Publish**: Make your form available for responses
6. **Share**: Use the generated link to collect responses

### Managing Responses

1. **View Analytics**: Real-time dashboard with comprehensive insights
2. **Monitor Trends**: Track response patterns over time
3. **Export Data**: Download CSV for external analysis
4. **Review Completion**: Identify optimization opportunities

### Advanced Features

#### Conditional Fields
```javascript
// Example: Show "Other" text field when "Other" is selected
{
  showIf: {
    fieldId: "choice-field-id",
    equals: "Other"
  }
}
```

#### PII Protection
- Mark sensitive fields as PII during form creation
- PII fields are excluded from analytics dashboard
- Data still available in CSV exports for authorized users

## 🏗 Architecture

### Frontend Architecture
```
frontend/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── forms/             # Form management
│   │   └── [id]/          # Dynamic form routes
│   │       ├── edit/      # Form editor
│   │       ├── share/     # Public form view
│   │       └── analytics/ # Analytics dashboard
│   ├── api-client.ts      # API communication
│   └── page.tsx           # Form builder
├── components/            # Reusable components
│   ├── AuthGuard.tsx     # Route protection
│   ├── Navbar.tsx        # Navigation
│   └── ToggleDark.tsx    # Theme switcher
└── styles/               # Global styles
```

### Backend Architecture
```
backend/
├── api/                   # API layer
│   ├── handlers.go       # HTTP handlers
│   ├── auth.go           # Authentication
│   ├── analytics.go      # Analytics computation
│   ├── websocket.go      # Real-time features
│   ├── models.go         # Data models
│   └── routes.go         # Route definitions
├── config/               # Configuration
│   └── config.go         # Environment setup
└── main.go               # Application entry
```

### Data Models

#### Form Structure
```go
type Form struct {
    ID        ObjectID  `json:"id"`
    Title     string    `json:"title"`
    Status    string    `json:"status"`    // "draft" | "published"
    Fields    []Field   `json:"fields"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
    OwnerID   string    `json:"ownerId"`
}
```

#### Field Types
```go
type Field struct {
    ID       string   `json:"id"`
    Label    string   `json:"label"`
    Type     string   `json:"type"`      // "text" | "single_choice" | "multi_select" | "rating"
    Required bool     `json:"required"`
    Options  []string `json:"options"`   // For choice fields
    Min      int      `json:"min"`       // For rating fields
    Max      int      `json:"max"`       // For rating fields
    ShowIf   *ShowIf  `json:"showIf"`    // Conditional logic
    IsPII    bool     `json:"isPII"`     // Privacy protection
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Form Management
- `GET /api/forms` - List user's forms (protected)
- `POST /api/forms` - Create new form (protected)
- `GET /api/forms/:id` - Get form details
- `PUT /api/forms/:id` - Update form (protected)

### Response Handling
- `POST /api/forms/:id/responses` - Submit response (public)
- `GET /api/forms/:id/analytics` - Get analytics (protected)
- `GET /api/forms/:id/export.csv` - Export CSV (protected)

### Real-time
- `WS /ws/forms/:id` - WebSocket connection for live updates

## 🎯 Demo Flow

1. **Setup**: Start both backend and frontend servers
2. **Registration**: Create a new user account
3. **Form Creation**: Build a sample form with various field types
4. **Draft Management**: Save and iterate on your form
5. **Publishing**: Publish the form to enable submissions
6. **Response Collection**: Submit test responses via the share link
7. **Live Analytics**: Watch real-time updates in the analytics dashboard
8. **Data Export**: Download response data as CSV

## 🔒 Security Features

- **Authentication**: JWT-based user authentication
- **Authorization**: Protected routes for form management
- **Input Validation**: Comprehensive client and server validation
- **PII Protection**: Special handling for sensitive data
- **CORS**: Configured cross-origin policies
- **Password Security**: bcrypt hashing with salt

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on all devices
- **Dark Mode**: Automatic theme detection and manual toggle
- **Loading States**: Smooth transitions and feedback
- **Error Handling**: User-friendly error messages
- **Accessibility**: Keyboard navigation and screen reader support
- **Visual Feedback**: Success states and progress indicators

## 📊 Analytics Features

- **Response Count**: Total submissions tracking
- **Completion Rate**: Form abandonment analysis
- **Field Analytics**: Per-field response breakdown
- **Trend Analysis**: 7-day response patterns
- **Skip Analysis**: Identify problematic fields
- **Rating Averages**: Automatic calculation for rating fields
- **Real-time Updates**: Live data via WebSocket

## 🚀 Production Deployment

### Environment Variables
```bash
# Backend
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/formbuilder
JWT_SECRET=production-secret-key
ALLOW_ORIGIN=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

### Build Commands
```bash
# Backend
go build -o formbuilder main.go

# Frontend
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by form builder best practices
- Designed for scalability and maintainability

---

**Note**: This is a demonstration project showcasing full-stack development capabilities with real-time features, comprehensive analytics, and modern UX patterns.
