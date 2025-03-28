# CacheNCarry
Capstone project for CSD317 - Introduction to Database Systems

# Local Development
1. Ensure the following are installed and functioning on your machine:
    - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
    - [Node](https://nodejs.org/en)
2. Clone this repository and navigate into it
```bash
git clone https://github.com/lalitm1004/cache-n-carry.git
cd cache-n-carry
```
3. Run `npm i` to install all relevant packages
4. Run `npm run db:start` and `npm run db:seed` to initialize MySQL server
5. [Optional] Start the prisma studio with `npx prisma studio`
6. Run `npm run dev` to get frontend running

## Initializing the Database in Docker
1. Run `docker-compose up -d`
2. [Optional] To verify the database schema via the MySQL shell:
   ```bash
   docker exec -it cache-n-carry-mysql-dev mysql -u dev_user -p
   ```
3. Enter the password specified in `docker/docker-compose.yml` when prompted.
