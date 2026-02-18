# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
COPY src /home/app/src
COPY pom.xml /home/app
RUN mvn -f /home/app/pom.xml clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-jammy
ENV JAVA_OPTIONS="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
WORKDIR /work/
COPY --from=build /home/app/target/quarkus-app/lib/ /work/lib/
COPY --from=build /home/app/target/quarkus-app/*.jar /work/
COPY --from=build /home/app/target/quarkus-app/app/ /work/app/
COPY --from=build /home/app/target/quarkus-app/quarkus/ /work/quarkus/

EXPOSE 8080
CMD ["java", "-jar", "quarkus-run.jar"]
