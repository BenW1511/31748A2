README.md
24971095 - Benjamin Christian Walters
31748 Programming on the Internet Assignment 2
Title: MTGDECKCOMPANION
Brief Summary of Problem Solved:
Problem: Websites for building and managing multiple decks within Magic The Gathering's (aka MTG for short) Commander format, plagued by slow searching, lack of deck analysis. and often are a pain to build and manage multiple decks through.
Solution: MTGDECKCOMPANION SPA, quick search functionality (with cards logged from Scryfall API into a mySQL database for efficient retrieval), deck analysis and insight, and the ability to efficiently create and manage (read and update) multiple decks.

Workload Allocation: As I am a one man team, I am the only working member and have been responsible for the project in its entirety.

Illustration of the technical stack:
- Frontend:
	SPA front end is split into three parts, a top bar, and beneath a dual panel (left/right) layout
	If the user is not logged in, many of the buttons are disabled (grey'd out), with the left panel displaying user login functionality, with the right displaying registration functionality.
	When the user is logged in, the left panel displays deck creation/saving/loading/deleting options and card search functionality beneath it, the right panel being changeable through the top bar buttons, alternating between viewing the user's deck, and analysis of the current deck.
	Whilst Admin is logged in, left panel displays each user's details (username, email, and role) with functionality to update user details or delete user details. This left panel also has each user's deck with an option to delete the deck, or view/edit said deck. Right panel displays the deck builder with each button grey'd out, pressing to edit a user's deck (from the left panel), the right panel beneath Deck Builder displays either the deck view or the analytics of the deck (where the top bar buttons now work).
- Styling
	Each component of the SPA contains its own CSS, meaning styling is within the scope of each respective Svelte component
	The SPA includes a dynamic gradient colour styling, where the background changes colour corresponding to the deck's commander's colour identity (e.g. black yielding grey, blue white red yielding a gradient of blue and red and white)
- Routing
	Sveltekit uses a file based approach to routing 
	src/routes/+page.svelte is the primary SPA page, with +layout.svelte as a wrapper for +page 
	src/routes/+layout.ts sets the SPA config with "ssr=false" (meaning server-side-rendering is disabled)
	src/routes/api/ contains backend API routing for authentication, deck management, card search, and admin functionality.
- Authentication/Security 
	Users are able to register and login through the SPA
	Passwords are hashed through bcryptjs before storage in MySQL database 
	JWT authentication is used to identify logged in user and maintain login state (JWT cookie is used to persist current user after page refresh)
	Admin only functionality is locked behind Admin explicit role, which only Admin account is able to modify
- Data
	- Data gathering
		Card data is collected from external API (Scryfall) with search results cached into MySQL cards table 
	- Data Storage
		User accounts, hashed passwords, roles, decks, cached card data, and deck-card relationships are stored in MySQL tables within the MySQL database.
		Within the database, table relations follow: 
			users (id primary key) to decks, as each deck can only belong to one user
			decks (id primary key) to deck_cards table, and cards (id primary key)to deck_cards table, as many decks have many cards, definining a many-to-many relationship which requires an intermediary table to resolve this many-to-many relationship.
		Sample database export is included within the folder database/ 
	- Data Management
		deck.ts handles current deck state and related actions (adding/removing cards, and loading decks)
		selectedDeck.ts tracks currently selected user deck 
		auth.ts manages currently logged in user on frontend
		ui.ts manages interface panel state 
		sqlDB.ts manages MySQL database connection 
		jwt.ts handles JWT creation, verification, and cookie handling 

Feature List: 
- User registration/login system with secure hashing of passwords and JWT authentication
- Enables user to create, read, and update multiple MTG Commander decks 
- Integration with Scryfall API for retrieval and caching of MTG card data 
- Dynamically adjustable interface for deck building and deck analysis 
- Administrative functionality for moderation of users and relevant data (reading, updating, and deleting of users, user account detail, or user decks)




Folder Structure Explanation:

src/ 
	lib/ - holds components, serverside helper files, stores, and shared TS types 
		assets/ - holds svelte logo
		components/ - contains the components that compose the SPA interface 
		server/ - files that help with server side operations 
		stores/ - Svelte stores for shared frontend state data
		types/ - holds TypeScript definitions 
	routes/ - contains Sveltekit page and API routes 
		api/ - backend API points
			admin/ - admin-only API functionality
				decks/ - admin deck operations  
					[id]/ - dynamic deck-specific route 
				users/ - admin user management operations
					[id]/- dynamic user-specific route 
			auth/ - Authentication related API routing
				login/ - user login functionality
				logout/ - user logout functionality 
				me/ - currently authenticated user retrieval
				register/ - user account registration function
			cards/ - card related API routing
				search/ - fetching card data from Scryfall API and caching of said searched card data 
			db-test/ - simple endpoint used internally for verification of database connection
			decks/ - deck management API route
				[id]/ - dynamic deck-specific operations
					cards/ - deck card management operations 
						[cardId]/ - dynamic routing for specific card within specific deck				
database/ - contains SQL files used to recreate project's database

Dependencies: 
- eslint - detecting coding errors in development to enforce coding standards
- mysql2 - enables communication between SPA and MySQL database
- jsonwebtoken - handles JWT creation and validation
- bcryptjs - used for hashing passwords

Admin Account Details 
- Username - Admin
- Email - Admin@hotmail.com
- Password - Admin

 
Please also see below - This content is from the README.md that is automatically created with every Svelte and Sveltekit project (reviewed and modified to ensure accuracy):

# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate the base SvelteKit configuration used for this project:

```sh
# recreate this project
npx sv@0.12.7 create --template minimal --types ts --add eslint --install npm A2
```

This recreates the base SvelteKit project with the minimal template, TypeScript, ESLint, and npm installation. Additional dependencies used by the completed application can then be installed with:

```sh
npm install mysql2 bcryptjs jsonwebtoken
npm install -D @types/jsonwebtoken
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.