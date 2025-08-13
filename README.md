# KNUST Student Enterprise Hub

A comprehensive platform for KNUST students to buy and sell products/services within the campus community.

## Features

- **Business Management**: Register and manage student businesses
- **Product Catalog**: Browse and search products by category
- **Order System**: Place orders with delivery tracking
- **User Reviews**: Rate and review businesses
- **Search & Filter**: Advanced search with location and category filters
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live order status updates

## Tech Stack

### Backend
- **Node.js** with **Express.js** framework
- **PostgreSQL** database with **pg** driver
- **RESTful API** architecture
- **MVC pattern** with separated controllers

### Frontend
- **HTML5** with **Bootstrap 5** for responsive design
- **Vanilla JavaScript** for interactivity
- **Font Awesome** icons
- **Google Fonts** (Poppins)

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd enterprise-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=knust_enterprise_hub
   DB_PASSWORD=your_password
   DB_PORT=5432
   PORT=3000
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb knust_enterprise_hub
   
   # Run schema (optional - tables will be created automatically)
   psql -d knust_enterprise_hub -f backend/db/schema.sql
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

## Database Schema

The application uses the following main tables:

- **users**: Student user accounts
- **businesses**: Registered student businesses
- **products**: Products/services offered by businesses
- **orders**: Customer orders and transactions
- **order_items**: Individual items in orders
- **reviews**: Business ratings and reviews
- **categories**: Business and product categories

## API Endpoints

### Businesses
- `GET /api/businesses` - Get all businesses
- `GET /api/businesses/:id` - Get business by ID
- `POST /api/businesses` - Create new business
- `PUT /api/businesses/:id` - Update business
- `DELETE /api/businesses/:id` - Delete business
- `GET /api/businesses/search/:query` - Search businesses

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/business/:businessId` - Get products by business

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `POST /api/users/login` - User login

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/cancel` - Cancel order

## Project Structure

```
enterprise-hub/
├── app.js                 # Main server file
├── package.json           # Dependencies and scripts
├── env.example           # Environment variables template
├── backend/
│   ├── controllers/      # Business logic
│   ├── routes/          # API route definitions
│   └── db/              # Database schema and migrations
├── public/               # Static frontend files
│   ├── index.html        # Main application page
│   ├── styles.css        # Main stylesheet
│   ├── styles2.css       # Additional styles
│   ├── scripts.js        # Frontend JavaScript
│   └── img/              # Image assets
└── README.md             # This file
```

## Usage

### For Students (Customers)
1. Browse businesses and products
2. Add items to cart
3. Place orders with delivery details
4. Track order status
5. Leave reviews and ratings

### For Business Owners
1. Register your business
2. Add products and services
3. Manage orders and inventory
4. View customer reviews
5. Update business information

## Development

### Running in Development Mode
```bash
npm run dev
```

### Database Migrations
The application automatically creates tables on first run. For manual schema updates:
```bash
psql -d knust_enterprise_hub -f backend/db/schema.sql
```

### Adding New Features
1. Create controller methods in `backend/controllers/`
2. Add routes in `backend/routes/`
3. Update frontend JavaScript in `public/scripts.js`
4. Add styles in `public/styles.css`

## Security Features

- Input validation and sanitization
- SQL injection prevention with parameterized queries
- CORS configuration
- Error handling without exposing sensitive information

## Performance Optimizations

- Database indexes on frequently queried columns
- Efficient JOIN queries with proper grouping
- Pagination for large datasets
- Connection pooling for database operations

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using port 3000

3. **Module Not Found Errors**
   - Run `npm install` to install dependencies
   - Check Node.js version compatibility

### Logs
Check console output for detailed error messages and database connection status.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

## Future Enhancements

- User authentication with JWT
- Real-time notifications
- Payment gateway integration
- Mobile app development
- Advanced analytics dashboard
- Multi-language support
