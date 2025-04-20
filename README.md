# CacheNCarry
Capstone project for CSD317-Introduction to Database Systems

# Local Development
1. Ensure you have the following installed on your machine:
   - Docker Desktop
   - Node V22+
   - npm
   - dos2unix

2. Clone this respository
```bash
git clone https://github.com/lalitm1004/cache-n-carry.git
cd cache-n-carry
```
3. Copy example environment variables into `.env` file
```bash
cp .env.example .env
``` 

4. Install all packages
```bash
npm i
```

5. Start and synchronize database
```bash
npm run db:start
npm run db:sync
```

6. Start development server
```bash
npm run dev
```

## Ways to access MySQL instance
- Use external studio connectors (some are provided in VSCode Extenion Marketplace)
- Run
```bash
docker exec -it cache-n-carry-mysql-dev mysql -uroot -prootpassword
```