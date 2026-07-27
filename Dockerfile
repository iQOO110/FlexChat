# ===== Stage 1: 构建前端 =====
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ===== Stage 2: 构建后端 =====
FROM maven:3.9-eclipse-temurin-21 AS backend-builder
WORKDIR /build
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn package -DskipTests -B

# ===== Stage 3: 运行时 =====
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=backend-builder /build/target/*.jar app.jar
COPY --from=frontend-builder /build/dist /app/static

EXPOSE 8080
CMD ["java", "-jar", "app.jar"]