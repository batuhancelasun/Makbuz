# 💶 Makbuz

A beautiful, self-hosted expense tracking application with PWA support. Perfect for home servers.

![Makbuz](https://img.shields.io/badge/makbuz-expense%20tracker-14B8A6?style=for-the-badge)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-supported-5A0FC8?style=for-the-badge)

## ✨ Features

- 📊 **Visual Analytics** - Beautiful donut chart showing expense breakdown by category
- 💰 **Income & Expense Tracking** - Track your monthly finances manually
- 🔄 **Recurring Transactions** - Support for recurring income/expenses (salary, rent, subscriptions)
- 📅 **Monthly & Yearly Views** - Switch between time periods
- 📋 **Table View** - See all transactions in a sortable table
- 🏷️ **Category Management** - Create, edit, and delete custom categories
- 🔐 **Password Protection** - Simple authentication for privacy
- 📱 **PWA Support** - Install on your phone for app-like experience
- 🌙 **Dark Theme** - Beautiful teal/cyan dark UI
- 💶 **EUR Currency** - Formatted for Euro

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  makbuz:
    image: batubaba619/makbuz:latest
    container_name: makbuz
    restart: unless-stopped
    ports:
      - "8085:8000"
    volumes:
      - makbuz_data:/app/data
    environment:
      - DATABASE_URL=sqlite:////app/data/makbuz.db
      - MAKBUZ_PASSWORD=your-secure-password
      - SECRET_KEY=your-random-secret-key

volumes:
  makbuz_data:
    driver: local
```

2. Start the container:

```bash
docker-compose up -d
```

3. Access at `http://localhost:8085`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MAKBUZ_PASSWORD` | Login password | `makbuz123` |
| `SECRET_KEY` | JWT secret key | `makbuz-secret-key-change-in-production` |
| `DATABASE_URL` | SQLite database path | `sqlite:////app/data/makbuz.db` |

> ⚠️ **Security:** Always change `MAKBUZ_PASSWORD` and `SECRET_KEY` in production!

## 📱 PWA Installation

**Important:** PWA install requires HTTPS.

### On Mobile:
- **iOS**: Open in Safari → Share → "Add to Home Screen"
- **Android**: Open in Chrome → Menu (⋮) → "Install app"

## 🛠️ Building from Source

### Prerequisites
- Docker
- Node.js 20+ (for development)
- Python 3.11+ (for development)

### Build Docker Image

```bash
docker build -t makbuz .
```

### Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📊 Screenshots

The app features:
- Dashboard with income/expense/balance cards
- Interactive donut chart (click categories to see details)
- Table view with all transactions
- Category management modal
- Mobile-responsive design

## 🔒 Security Notes

- Change the default password immediately
- Use HTTPS in production (required for PWA)
- The app is designed for private/home server use
- All data is stored locally in SQLite

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| GET | `/api/incomes` | List income |
| POST | `/api/incomes` | Create income |
| GET | `/api/stats/monthly` | Monthly statistics |
| GET | `/api/stats/yearly` | Yearly statistics |
| GET | `/api/transactions` | All transactions |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - Feel free to use and modify!

---

Made with 💚 for home server enthusiasts
