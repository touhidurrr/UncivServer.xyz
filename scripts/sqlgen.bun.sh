prisma migrate dev --name temp
mv prisma/*/*/migration.sql prisma/generated.sql
rm -rf prisma/migrations* prisma/test*
