# Stage 1: Build with Maven & Java 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Minimal Runtime Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S crithit && adduser -S crithit -G crithit \
    && apk add --no-cache wget

COPY --from=builder /app/target/crithit-api-*.jar /app/app.jar

RUN chown -R crithit:crithit /app
USER crithit

EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseZGC -XX:+ZGenerational -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
