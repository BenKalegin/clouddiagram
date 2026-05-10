# Services Layer

This directory contains services that handle cross-cutting concerns in the application. Services are organized by functionality and are designed to be used across different features.

## Service Categories

- **persistence**: Services for persisting and retrieving data
- **export**: Services for exporting diagrams in various formats
- **recovery**: Services for recovering diagrams from persisted state
- **theme**: Services for managing application theme and layout

## Usage Guidelines

1. Services should be stateless when possible
2. Services should have a clear, single responsibility
3. Services should be testable in isolation
4. Services should not depend on UI components
5. Services can depend on other services, but circular dependencies should be avoided