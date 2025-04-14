# GigNation

A platform connecting vendors and customers for various gigs.

## Features
- User Authentication (Register, Login, Password Reset)
- Role-based Access Control (User, Vendor, Admin)
- Service Management
- Order Processing
- Vendor Dashboard
- Admin Dashboard
- API Documentation with Swagger

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/gignation
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:3000 (or the port specified in your .env file)

## API Documentation

The API documentation is available through Swagger UI at:
```
http://localhost:3000/api-docs
```