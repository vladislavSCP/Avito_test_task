# Avito Ads Moderation System

Упрощённая система модерации объявлений:
- /list - список с фильтрами, сортировкой, пагинацией и bulk-операциями
- /item/:id - карточка объявления, история модерации, панель решений, hotkeys
- /stats - статистика модератора, графики, экспорт

## Stack

Client:
- React 18 + TypeScript
- Vite
- react-router-dom
- @tanstack/react-query
- Ant Design
- recharts
- axios

Server:
- Node.js 20
- Express

### Почему эти технологии
- TypeScript - защищает от ошибок в сущностях объявлений.
- React Query - кэш, отмена запросов при навигации, простые асинхронные запросы.
- Ant Design - быстрый UI-kit, чтобы сосредоточиться на логике.
- Vite - быстрый dev и сборка.
- Recharts - диаграммы для /stats без ручной отрисовки.

## Project structure

