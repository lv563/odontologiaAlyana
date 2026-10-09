# Construye y ejecuta la API (migra la base de datos y siembra datos al arrancar).
# Se construye desde la carpeta backend/: docker build -f Dockerfile .

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY OdontoAlyana.sln ./
COPY src/OdontoAlyana.Domain/*.csproj src/OdontoAlyana.Domain/
COPY src/OdontoAlyana.Application/*.csproj src/OdontoAlyana.Application/
COPY src/OdontoAlyana.Infrastructure/*.csproj src/OdontoAlyana.Infrastructure/
COPY src/OdontoAlyana.Api/*.csproj src/OdontoAlyana.Api/
RUN dotnet restore

COPY . .
RUN dotnet publish src/OdontoAlyana.Api -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
# Render (y la mayoria de hosts) inyectan el puerto real en $PORT; escuchamos ahi.
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "OdontoAlyana.Api.dll"]
