# NIST FC Website — Project Specification

## 1. Project Overview

### Project Name

NIST FC

### Project Purpose

NIST FC is the official digital home and historical archive of the NIST University men's football team.

The website will showcase the people, memories, events, and history of NIST FC. It will allow visitors to explore both current and former players, view player profiles, discover photographs and memories from the team's journey, and learn about the founders and important moments in the team's history.

The website will also provide a secure administration system through which authorized NIST FC administrators can manage the website's content without requiring code changes.

---

## 2. Team Scope

The website represents:

- NIST FC
- Men's football team only

The initial version will not include a women's team or other sports.

---

## 3. Main Goals

The website should:

1. Represent the identity of NIST FC.
2. Showcase current players.
3. Preserve information about former players who have graduated or left the team.
4. Preserve the team's memories and photographs.
5. Document the history of NIST FC through a timeline.
6. Showcase the founders of the team.
7. Allow visitors to easily search and explore players.
8. Allow authorized administrators to manage all website content.
9. Provide a long-term digital archive for future generations of NIST FC players.

---

## 4. Player Archive

The player system will contain both:

### Current Players

Players who are currently part of NIST FC.

### Former Players

Players who previously represented NIST FC but have graduated or are no longer active with the team.

The website should clearly distinguish between current and former players.

Example:

    Current Players
    ├── Player
    ├── Player
    └── Player

    Former Players
    ├── Player
    ├── Player
    └── Player

The distinction should be based on the player's status rather than deleting former players from the database.

Former players are part of the permanent history of NIST FC.

---

## 5. Player Information

The initial player profile will intentionally remain simple.

Each player will contain:

- Name
- Photo
- Position
- Batch
- Branch
- Bio

Example:

    Name: Arjun Kumar
    Photo: Player photograph
    Position: Right Winger
    Batch: 2023
    Branch: CSE
    Bio: Short player biography

No player statistics will be included in V1.

The following will NOT be part of the initial player profile:

- Goals
- Assists
- Matches played
- Clean sheets
- Player ratings
- Height
- Weight
- Phone number
- Email address
- Semester
- Preferred foot
- Other unnecessary personal information

These may be considered for future versions only if there is a clear requirement.

---

## 6. Player Batch

The player's batch will be represented using a simple year.

Example:

    Batch: 2023

The batch is separate from the player's current/former status.

Example:

    Current Player
    Batch: 2024

    Former Player
    Batch: 2021

---

## 7. Public Website

The initial public website will contain:

- Home
- Players
- Player Profile
- Memories
- Memory Detail
- Timeline
- Founders
- About

---

## 8. Player Discovery

Visitors should be able to:

- Browse players
- Search players
- Filter players
- View current players
- View former players
- Open individual player profiles

The player directory should make it easy to discover players based on information such as:

- Name
- Position
- Batch
- Branch

---

## 9. Memories

NIST FC will maintain a digital archive of team memories.

Memories can include:

- Matches
- Tournaments
- Training sessions
- Team gatherings
- Celebrations
- Trips
- Farewells
- Important team moments
- Historical photographs

Each memory can contain:

- Title
- Description
- Date
- Location
- Cover photo
- Multiple photographs
- Players involved
- Tags

---

## 10. Timeline

The website will contain a chronological timeline representing important moments in NIST FC's history.

Examples:

    2022
    Team Founded

    2023
    Important Team Event

    2024
    Tournament

    2025
    Championship

The timeline is intended to document the development and history of NIST FC rather than football statistics.

---

## 11. Founders

The website will contain a dedicated section for the founders/co-founders of NIST FC.

The founders section will showcase the people responsible for starting and establishing the team.

Founder information will include:

- Name
- Photo
- Role
- Batch
- Branch
- Bio
- Quote

---

## 12. Administration

NIST FC administrators will have access to a separate admin panel.

The public website and admin panel will be separate interfaces.

Administrators will be able to manage:

- Players
- Memories
- Timeline events
- Founders
- Photographs

The initial system will support approximately 2–3 authorized administrators.

---

## 13. Content Management Principle

Website content should be managed through the admin panel.

Administrators should not need to modify source code to:

- Add a player
- Edit a player
- Remove a player
- Add a memory
- Upload photographs
- Edit a memory
- Add a timeline event
- Edit a timeline event
- Manage founders

Changes made through the admin panel should be reflected on the public website.

---

## 14. Image Management

Images will be stored using a dedicated image storage and optimization service such as Cloudinary.

The application database will store image references/URLs rather than storing raw image files.

Images may include:

- Player photographs
- Memory photographs
- Founder photographs
- Timeline photographs
- Team photographs

---

## 15. Long-Term Vision

NIST FC should function as a long-term digital archive.

A player who joins NIST FC in the future should be able to find:

- Current players
- Former players
- Previous batches
- Team memories
- Important events
- Founders
- Historical timeline

The website should preserve the history of NIST FC across generations of players.

---

## 16. Out of Scope for V1

The following will not be implemented initially:

- Player statistics
- Match statistics
- Goals/assists tracking
- Live scores
- Match prediction
- Player ratings
- Chat
- Social networking
- Notifications
- Mobile application
- AI chatbot
- Complex analytics
- Fantasy football functionality