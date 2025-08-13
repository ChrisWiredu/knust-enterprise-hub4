# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env with your database details
# Update DB_PASSWORD with your actual PostgreSQL password
```

### 3. Create Database
```bash
# Create PostgreSQL database
createdb knust_enterprise_hub
```

### 4. Initialize Database
```bash
# Run the startup script (recommended)
node startup.js

# Or manually initialize
npm run db:init
```

### 5. Start the Server
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

### 6. Open in Browser
🌐 **http://localhost:3000**

---

## 🔧 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your password in `.env`
- Verify database exists: `createdb knust_enterprise_hub`

### Port Already in Use
- Change PORT in `.env` file
- Or kill process: `lsof -ti:3000 | xargs kill`

### Module Not Found
- Run `npm install` again
- Check Node.js version (v14+ required)

---

## 📱 Features Available

✅ **Business Registration** - Students can register their businesses  
✅ **Product Catalog** - Browse and search products  
✅ **Shopping Cart** - Add items and manage cart  
✅ **Order System** - Place orders with delivery tracking  
✅ **User Reviews** - Rate and review businesses  
✅ **Responsive Design** - Works on all devices  

---

## 🗄️ Database Tables

- **users** - Student accounts
- **businesses** - Registered businesses  
- **products** - Products/services
- **orders** - Customer orders
- **reviews** - Business ratings
- **categories** - Business categories

---

## 🔐 Default Data

The system comes with sample data:
- 3 sample users
- 3 sample businesses
- 6 sample products
- Sample reviews and ratings

---

## 📚 Next Steps

1. **Customize** - Update business categories and locations
2. **Add Features** - Implement user authentication
3. **Deploy** - Deploy to production server
4. **Mobile App** - Build React Native mobile app

---

## 🆘 Need Help?

- Check the full [README.md](README.md)
- Review error messages in console
- Ensure all dependencies are installed
- Verify PostgreSQL connection

---

**Happy Coding! 🎉**
