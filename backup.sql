--
-- PostgreSQL database dump
--

\restrict ND9oag0crR8xshroJ8O2rYfamPlPd7yU7dPPFQ09OgY5v9FdOM9adf2s1ebPRU9

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg12+1)
-- Dumped by pg_dump version 16.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."PublicRSVP" DROP CONSTRAINT IF EXISTS "PublicRSVP_activityInstanceId_fkey";
ALTER TABLE IF EXISTS ONLY public."Participation" DROP CONSTRAINT IF EXISTS "Participation_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Participation" DROP CONSTRAINT IF EXISTS "Participation_friendId_fkey";
ALTER TABLE IF EXISTS ONLY public."Participation" DROP CONSTRAINT IF EXISTS "Participation_activityInstanceId_fkey";
ALTER TABLE IF EXISTS ONLY public."Location" DROP CONSTRAINT IF EXISTS "Location_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Friend" DROP CONSTRAINT IF EXISTS "Friend_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."CoreValue" DROP CONSTRAINT IF EXISTS "CoreValue_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Activity" DROP CONSTRAINT IF EXISTS "Activity_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ActivityValue" DROP CONSTRAINT IF EXISTS "ActivityValue_valueId_fkey";
ALTER TABLE IF EXISTS ONLY public."ActivityValue" DROP CONSTRAINT IF EXISTS "ActivityValue_activityId_fkey";
ALTER TABLE IF EXISTS ONLY public."ActivityInstance" DROP CONSTRAINT IF EXISTS "ActivityInstance_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."ActivityInstance" DROP CONSTRAINT IF EXISTS "ActivityInstance_locationId_fkey";
ALTER TABLE IF EXISTS ONLY public."ActivityInstance" DROP CONSTRAINT IF EXISTS "ActivityInstance_activityId_fkey";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."User_email_idx";
DROP INDEX IF EXISTS public."PublicRSVP_createdAt_idx";
DROP INDEX IF EXISTS public."PublicRSVP_activityInstanceId_idx";
DROP INDEX IF EXISTS public."Participation_userId_idx";
DROP INDEX IF EXISTS public."Participation_friendId_idx";
DROP INDEX IF EXISTS public."Participation_friendId_activityInstanceId_key";
DROP INDEX IF EXISTS public."Participation_activityInstanceId_idx";
DROP INDEX IF EXISTS public."Location_userId_idx";
DROP INDEX IF EXISTS public."Friend_userId_idx";
DROP INDEX IF EXISTS public."CoreValue_userId_name_key";
DROP INDEX IF EXISTS public."CoreValue_userId_idx";
DROP INDEX IF EXISTS public."Activity_userId_idx";
DROP INDEX IF EXISTS public."ActivityValue_valueId_idx";
DROP INDEX IF EXISTS public."ActivityValue_activityId_valueId_key";
DROP INDEX IF EXISTS public."ActivityValue_activityId_idx";
DROP INDEX IF EXISTS public."ActivityInstance_userId_idx";
DROP INDEX IF EXISTS public."ActivityInstance_datetime_idx";
DROP INDEX IF EXISTS public."ActivityInstance_activityId_idx";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."PublicRSVP" DROP CONSTRAINT IF EXISTS "PublicRSVP_pkey";
ALTER TABLE IF EXISTS ONLY public."Participation" DROP CONSTRAINT IF EXISTS "Participation_pkey";
ALTER TABLE IF EXISTS ONLY public."Location" DROP CONSTRAINT IF EXISTS "Location_pkey";
ALTER TABLE IF EXISTS ONLY public."Friend" DROP CONSTRAINT IF EXISTS "Friend_pkey";
ALTER TABLE IF EXISTS ONLY public."CoreValue" DROP CONSTRAINT IF EXISTS "CoreValue_pkey";
ALTER TABLE IF EXISTS ONLY public."Activity" DROP CONSTRAINT IF EXISTS "Activity_pkey";
ALTER TABLE IF EXISTS ONLY public."ActivityValue" DROP CONSTRAINT IF EXISTS "ActivityValue_pkey";
ALTER TABLE IF EXISTS ONLY public."ActivityInstance" DROP CONSTRAINT IF EXISTS "ActivityInstance_pkey";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."PublicRSVP";
DROP TABLE IF EXISTS public."Participation";
DROP TABLE IF EXISTS public."Location";
DROP TABLE IF EXISTS public."Friend";
DROP TABLE IF EXISTS public."CoreValue";
DROP TABLE IF EXISTS public."ActivityValue";
DROP TABLE IF EXISTS public."ActivityInstance";
DROP TABLE IF EXISTS public."Activity";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Activity" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ActivityInstance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ActivityInstance" (
    id text NOT NULL,
    "userId" text NOT NULL,
    datetime timestamp(3) without time zone NOT NULL,
    location text,
    "activityId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "customTitle" text,
    venue text,
    address text,
    city text,
    state text,
    "zipCode" text,
    "detailedDescription" text,
    requirements text,
    "contactInfo" text,
    "venueType" text,
    "priceInfo" text,
    capacity integer,
    "endDate" timestamp(3) without time zone,
    "isAllDay" boolean DEFAULT false NOT NULL,
    "locationId" text,
    "eventUrl" text,
    "hostAttending" boolean DEFAULT true NOT NULL
);


--
-- Name: ActivityValue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ActivityValue" (
    id text NOT NULL,
    "activityId" text NOT NULL,
    "valueId" text NOT NULL
);


--
-- Name: CoreValue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CoreValue" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Friend; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Friend" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    "group" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    email text,
    notes text
);


--
-- Name: Location; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Location" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'Venue'::text NOT NULL,
    address text,
    description text,
    website text,
    "imageUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Participation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Participation" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "friendId" text NOT NULL,
    "activityInstanceId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PublicRSVP; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PublicRSVP" (
    id text NOT NULL,
    "activityInstanceId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    message text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "friendId" text
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "profilePicture" text,
    timezone text,
    preferences jsonb,
    "googleApiKey" text
);


--
-- Data for Name: Activity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Activity" (id, "userId", name, description, "createdAt", "updatedAt") FROM stdin;
cmdbu08v1001nle04l1abfrfk	cmcl0reea0000f73ku9842dfd	Theatre	Going to the Theatre	2025-07-20 15:28:28.381	2025-07-20 15:28:28.381
cmdd2vhrt000dl8043rx1dkkt	cmcl0reea0000f73ku9842dfd	Dinner with Friends		2025-07-21 12:24:29.37	2025-07-21 12:24:29.37
cmdhewhcl0003l804h32ubb8g	cmcl0reea0000f73ku9842dfd	Long Weekend Short Haul Break with Friends	A 3–4 day trip to unwind, laugh, explore a new place together. Think laughter over dinner, coastal walks, small adventures.	2025-07-24 13:12:15.573	2025-07-24 13:12:15.573
cmdhexqbh0009l804whzutkwv	cmcl0reea0000f73ku9842dfd	Work from Altea (or similar)	Live and work from a place where you have existing ties. Reconnect with people, reset your rhythm, enjoy being part of something ongoing.  \nStart to build out your 2 place life!	2025-07-24 13:13:13.853	2025-07-24 13:13:13.853
cmdw63fpq0001l504v090u4hi	cmcl0reea0000f73ku9842dfd	Hiking		2025-08-03 21:02:16.142	2025-08-03 21:02:16.142
cmeakf90n0001jq04b4rfgss2	cmcl0reea0000f73ku9842dfd	Go to a Gig!	A gig - so much music out there - how about sofar sounds? Proms? Jazz?	2025-08-13 22:52:08.424	2025-08-13 22:52:28.939
\.


--
-- Data for Name: ActivityInstance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ActivityInstance" (id, "userId", datetime, location, "activityId", "createdAt", "updatedAt", "customTitle", venue, address, city, state, "zipCode", "detailedDescription", requirements, "contactInfo", "venueType", "priceInfo", capacity, "endDate", "isAllDay", "locationId", "eventUrl", "hostAttending") FROM stdin;
cmjriqc0p0001ju04qvwv6qm9	cmcl0reea0000f73ku9842dfd	2025-12-30 19:00:00	Som Saa, 43a Commercial St, London E1 6BD, United Kingdom	cmdd2vhrt000dl8043rx1dkkt	2025-12-29 18:55:22.969	2025-12-29 19:11:49.702	Som Saa	Som Saa	43a Commercial St, London E1 6BD, United Kingdom	\N	\N	\N	Authentic Thai food with a focus on regional specialties, located in a former public toilet.	\N	\N	Restaurant	\N	\N	\N	f	\N	\N	t
cmjrkcvq20001kw04t2ff5s3o	cmcl0reea0000f73ku9842dfd	2025-12-31 19:30:00	Prince of Wales Theatre, 31 Coventry St, London W1D 6AS, United Kingdom	cmeakf90n0001jq04b4rfgss2	2025-12-29 19:40:54.555	2025-12-29 19:40:54.555	The Book of Mormon	Prince of Wales Theatre	31 Coventry St, London W1D 6AS, United Kingdom	\N	\N	\N	A satirical musical that critiques the beliefs and practices of the Latter-day Saints. It follows two young missionaries sent to a remote village in Uganda.	\N	\N	Theatre	\N	\N	\N	f	\N	\N	t
cmjrkts320001jl04sfuk1zud	cmcl0reea0000f73ku9842dfd	2025-12-30 20:00:00	Lahore Kebab House, 4 & 37 Commercial St, London E1 6BD, United Kingdom	cmdd2vhrt000dl8043rx1dkkt	2025-12-29 19:54:02.99	2025-12-29 19:54:02.99	Lahore Kebab House	Lahore Kebab House	4 & 37 Commercial St, London E1 6BD, United Kingdom	\N	\N	\N	A long-standing and beloved East London institution, famous for its authentic Pakistani and North Indian cuisine, particularly its grilled kebabs and curries. Known for generous portions and good value.	\N	\N	Restaurant	\N	\N	\N	f	\N	https://www.google.com/maps/search/lahore+kebab+house+london/	t
\.


--
-- Data for Name: ActivityValue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ActivityValue" (id, "activityId", "valueId") FROM stdin;
cmdbu08v1001ple04iawxxg2i	cmdbu08v1001nle04l1abfrfk	cmdbtzspm001lle044axw0vqr
cmdd2vhrt000fl804ulwr5pno	cmdd2vhrt000dl8043rx1dkkt	cmdd2takv0003l8049g1efbbi
cmdhewhcl0005l804ojjeea29	cmdhewhcl0003l804h32ubb8g	cmdd2takv0003l8049g1efbbi
cmdhewhcl0006l804i1wr4nsm	cmdhewhcl0003l804h32ubb8g	cmdd2u9q80009l804csu2suz9
cmdhewhcl0007l8044kig8v95	cmdhewhcl0003l804h32ubb8g	cmdd2tklj0005l8044mlj4ux7
cmdhexqbh000bl804jczh13k7	cmdhexqbh0009l804whzutkwv	cmdd2uiru000bl804ngw1nqg4
cmdhexqbh000cl8042y98q59j	cmdhexqbh0009l804whzutkwv	cmdd2takv0003l8049g1efbbi
cmdhexqbh000dl804g5rigmbl	cmdhexqbh0009l804whzutkwv	cmdd2tztp0007l804pdri2krr
cmdhexqbh000el8041gschpjy	cmdhexqbh0009l804whzutkwv	cmdd2tklj0005l8044mlj4ux7
cmdhexqbh000fl804r1dl58ez	cmdhexqbh0009l804whzutkwv	cmdhevfsp0001l804zgfbnz7c
cmdw63fpq0003l5041jciwjqu	cmdw63fpq0001l504v090u4hi	cmdhevfsp0001l804zgfbnz7c
cmdw63fpq0004l504duzxljw5	cmdw63fpq0001l504v090u4hi	cmdd2takv0003l8049g1efbbi
cmdw63fpq0005l504nw1up6kk	cmdw63fpq0001l504v090u4hi	cmdd2tklj0005l8044mlj4ux7
cmdw63fpq0006l504w7y7pz9b	cmdw63fpq0001l504v090u4hi	cmdd2t2240001l804hn063x0l
cmeakfouj0009jq04n2havirj	cmeakf90n0001jq04b4rfgss2	cmdd2tklj0005l8044mlj4ux7
cmeakfouj000ajq044c71mpem	cmeakf90n0001jq04b4rfgss2	cmdhevfsp0001l804zgfbnz7c
cmeakfouj000bjq04wfzyts0z	cmeakf90n0001jq04b4rfgss2	cmdd2takv0003l8049g1efbbi
cmeakfouj000cjq04uag6qttw	cmeakf90n0001jq04b4rfgss2	cmdbtzspm001lle044axw0vqr
cmeakfouj000djq043mh9ddxu	cmeakf90n0001jq04b4rfgss2	cmdd2t2240001l804hn063x0l
\.


--
-- Data for Name: CoreValue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CoreValue" (id, "userId", name, description, "createdAt", "updatedAt") FROM stdin;
cmdbtzspm001lle044axw0vqr	cmcl0reea0000f73ku9842dfd	Culture	Enjoying the great things out there in London (or the world!) that enrich	2025-07-20 15:28:07.451	2025-07-20 15:28:07.451
cmdd2t2240001l804hn063x0l	cmcl0reea0000f73ku9842dfd	Vitality	Moving, sweating, lifting. Building the body and the will.\nExample: "Gym sessions, hikes, yoga flows, dance classes."	2025-07-21 12:22:35.693	2025-07-21 12:22:35.693
cmdd2takv0003l8049g1efbbi	cmcl0reea0000f73ku9842dfd	Connection	Conversations that nourish. People who get you.\nExample: "Dinner with an old friend, hosting a small group."	2025-07-21 12:22:46.736	2025-07-21 12:22:46.736
cmdd2tklj0005l8044mlj4ux7	cmcl0reea0000f73ku9842dfd	Presence	Slowing down to listen, feel, breathe.\nExample: "Riverside walks, forest trails, breathwork, gong baths."	2025-07-21 12:22:59.72	2025-07-21 12:23:07.967
cmdd2tztp0007l804pdri2krr	cmcl0reea0000f73ku9842dfd	Creativity	Making something from nothing. Joy in the process.\nExample: "Cooking a new dish, playing guitar, designing a t-shirt."	2025-07-21 12:23:19.454	2025-07-21 12:23:19.454
cmdd2u9q80009l804csu2suz9	cmcl0reea0000f73ku9842dfd	Playfulness	Being silly, spontaneous, alive.\nExample: "Karaoke night, Latin dancing, playful flirtation, games."	2025-07-21 12:23:32.288	2025-07-21 12:23:32.288
cmdd2uiru000bl804ngw1nqg4	cmcl0reea0000f73ku9842dfd	Growth	Learning, reflecting, expanding.\nExample: "Reading, solo travel, online courses, journaling."	2025-07-21 12:23:44.01	2025-07-21 12:23:44.01
cmdhevfsp0001l804zgfbnz7c	cmcl0reea0000f73ku9842dfd	Community	Feeling part of something bigger than yourself — building, contributing to, and belonging within shared spaces, identities, or circles.	2025-07-24 13:11:26.905	2025-07-24 13:11:26.905
\.


--
-- Data for Name: Friend; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Friend" (id, "userId", name, "group", "createdAt", "updatedAt", email, notes) FROM stdin;
cmdbtxd6p0000le04j3cfstp3	cmcl0reea0000f73ku9842dfd	Dave KZ	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6p0001le04x9fq9zvb	cmcl0reea0000f73ku9842dfd	Pia	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6p0002le046ytwkxmh	cmcl0reea0000f73ku9842dfd	Mike KZ	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6p0003le04540m7lt1	cmcl0reea0000f73ku9842dfd	Nari	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6p0004le04psmu9de8	cmcl0reea0000f73ku9842dfd	Sandra	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6p0005le0498m0zgod	cmcl0reea0000f73ku9842dfd	Gareth	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6p0006le04wiv2nfi2	cmcl0reea0000f73ku9842dfd	Jonny	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6p0007le040ntuxrxz	cmcl0reea0000f73ku9842dfd	James R	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6p0008le04jwjc5aqk	cmcl0reea0000f73ku9842dfd	Bhanita	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6p0009le04mejw92uy	cmcl0reea0000f73ku9842dfd	Elliot	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000ble04fog25iqe	cmcl0reea0000f73ku9842dfd	Clouds	Escape	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000cle04e9ovbf2r	cmcl0reea0000f73ku9842dfd	Mamta	Escape	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000ele04hrdpbctd	cmcl0reea0000f73ku9842dfd	Sanjai	Escape	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000fle04mvrft7ns	cmcl0reea0000f73ku9842dfd	Rishi	Escape	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000gle04gs9cv301	cmcl0reea0000f73ku9842dfd	Dipti	Escape	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000hle04m3kc751s	cmcl0reea0000f73ku9842dfd	Neil	Escape	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000ile04a3g5q89l	cmcl0reea0000f73ku9842dfd	Simon	Escape	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000jle04w4dkydkp	cmcl0reea0000f73ku9842dfd	Nitesh	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000kle042lqbbwkj	cmcl0reea0000f73ku9842dfd	Sona	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000lle04lsbg4tnv	cmcl0reea0000f73ku9842dfd	Jill	Uni	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000mle04fxydhh38	cmcl0reea0000f73ku9842dfd	Dave H	Uni	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000nle04pa2omcce	cmcl0reea0000f73ku9842dfd	Sol	Uni	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000qle04oa7dfr85	cmcl0reea0000f73ku9842dfd	Margo	Uni	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000rle04yzm4that	cmcl0reea0000f73ku9842dfd	Sunny	Escape	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000sle04ywuiptn4	cmcl0reea0000f73ku9842dfd	Sid	Local	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000tle04h7nmpkcu	cmcl0reea0000f73ku9842dfd	Jinny	Local	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000ule04h3lbj30z	cmcl0reea0000f73ku9842dfd	Iva	Local	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000wle04ghd9a8cx	cmcl0reea0000f73ku9842dfd	Kat	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000xle04c2cphwy1	cmcl0reea0000f73ku9842dfd	Mirko	D&P	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000yle04az6fnu9c	cmcl0reea0000f73ku9842dfd	Kul	Twaddi	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q000zle041njjcd67	cmcl0reea0000f73ku9842dfd	Billy	Twaddi	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q0010le04tc4lafqk	cmcl0reea0000f73ku9842dfd	Paul	Uni	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q0011le040uc33i1l	cmcl0reea0000f73ku9842dfd	Sian	Uni	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q0012le04a585cocf	cmcl0reea0000f73ku9842dfd	Harbs	Twaddi	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q0013le04avv2rgii	cmcl0reea0000f73ku9842dfd	Neshie	Twaddi	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q0014le04g3xxw81y	cmcl0reea0000f73ku9842dfd	J	Twaddi	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q0015le04hd3dk6gz	cmcl0reea0000f73ku9842dfd	Indy	Twaddi	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q0016le04pjp3gexm	cmcl0reea0000f73ku9842dfd	Mitesh	Twaddi	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q0017le04oj9x0oyx	cmcl0reea0000f73ku9842dfd	Sonalee	Twaddi	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q0018le04gdafb71d	cmcl0reea0000f73ku9842dfd	Rahul	Twaddi	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q0019le049uaikkny	cmcl0reea0000f73ku9842dfd	Hardeep	School	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q001ale04dtce0zno	cmcl0reea0000f73ku9842dfd	Hiba	School	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q001ble044b63mxhi	cmcl0reea0000f73ku9842dfd	Suha	School	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q001cle045e98vkcb	cmcl0reea0000f73ku9842dfd	Big Nitesh	Escape	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q001dle04o1kx3gvr	cmcl0reea0000f73ku9842dfd	Dave B	School	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q001ele04hgi2flzk	cmcl0reea0000f73ku9842dfd	Amrish	School	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q001fle047pthcrz0	cmcl0reea0000f73ku9842dfd	Elize	Local	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q001gle04aforwxle	cmcl0reea0000f73ku9842dfd	Andrew	Local	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q001hle04kbua6o44	cmcl0reea0000f73ku9842dfd	Carmen	Local	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtxd6q001ile04die1g390	cmcl0reea0000f73ku9842dfd	Dan	Local	2025-07-20 15:26:14.017	2025-07-20 15:26:14.017	\N	\N
cmdbtyfmn001jle04slzhlgu4	cmcl0reea0000f73ku9842dfd	Paul (Escape)	Local	2025-07-20 15:27:03.839	2025-07-20 15:27:03.839	\N	\N
cmdg6mxi90003l7040hlfz2gm	cmcl0reea0000f73ku9842dfd	Tim Slbley	Local	2025-07-23 16:33:06.849	2025-07-23 16:33:06.849	\N	\N
cmdlo4p4w0007l504uv8nxczp	cmcl0reea0000f73ku9842dfd	Tania Plahay		2025-07-27 12:41:40.068	2025-07-27 12:41:40.068	\N	\N
cmdlo46920005l504sne696cy	cmcl0reea0000f73ku9842dfd	Amit Bansal		2025-07-27 12:41:15.594	2025-07-27 12:41:49.159	\N	\N
cmdlo5pg50009l5043vdbrh4o	cmcl0reea0000f73ku9842dfd	Priya	Escape	2025-07-27 12:42:27.129	2025-07-27 12:42:27.129	\N	\N
cmdn21shf0001jv04nompj8ga	cmcl0reea0000f73ku9842dfd	Lizzy	Local	2025-07-28 11:59:03.932	2025-07-28 11:59:03.932	\N	\N
cmdn22gjw0003jv04afbufz5e	cmcl0reea0000f73ku9842dfd	Mo	Local	2025-07-28 11:59:36.43	2025-07-28 11:59:36.43	\N	\N
cmdw6fase0001jo04m0zr3jbw	cmcl0reea0000f73ku9842dfd	Enrico		2025-08-03 21:11:29.63	2025-08-03 21:11:29.63	\N	\N
cme66307r0001kz04icltyaxc	cmcl0reea0000f73ku9842dfd	James	LBG	2025-08-10 20:59:37.723	2025-08-10 20:59:37.723	\N	\N
cme6637le0003kz041gxtmxqt	cmcl0reea0000f73ku9842dfd	Prit	LBG	2025-08-10 20:59:47.379	2025-08-10 20:59:47.379	\N	\N
cme663g280005kz0407s5ng5t	cmcl0reea0000f73ku9842dfd	Evie	LBG	2025-08-10 20:59:58.261	2025-08-10 20:59:58.261	\N	\N
cme664nfn0007kz04izcgaizt	cmcl0reea0000f73ku9842dfd	Beth	Local	2025-08-10 21:00:54.471	2025-08-10 21:00:54.471	\N	\N
cme664ve60009kz04ovlm1w2o	cmcl0reea0000f73ku9842dfd	Sunny	Local	2025-08-10 21:01:04.879	2025-08-10 21:01:04.879	\N	\N
cme6667tr000bkz04cuz5t0aj	cmcl0reea0000f73ku9842dfd	Tash	Escape	2025-08-10 21:02:07.555	2025-08-10 21:02:07.555	\N	\N
cme666tpa000dkz04yyggolex	cmcl0reea0000f73ku9842dfd	Anil	Local	2025-08-10 21:02:35.999	2025-08-10 21:02:35.999	\N	\N
cmdbtxd6p000ale04apntt31y	cmcl0reea0000f73ku9842dfd	Charlie	D&P	2025-07-20 15:26:14.017	2025-08-18 20:51:22.01	\N	\N
cmdbtxd6q000ple04f201e11r	cmcl0reea0000f73ku9842dfd	Geoff	D&P	2025-07-20 15:26:14.017	2025-08-18 20:51:39.398	\N	\N
cmdbtxd6q000ole04gtcofa6k	cmcl0reea0000f73ku9842dfd	Mark	D&P	2025-07-20 15:26:14.017	2025-08-18 20:52:04.493	\N	\N
cmfk682wa0001jm04prgjrbev	cmcl0reea0000f73ku9842dfd	Jon Chubb	Uni	2025-09-14 20:52:03.368	2025-09-14 20:52:03.368	\N	\N
cmfk68bqd0003jm04p9pylcl2	cmcl0reea0000f73ku9842dfd	Neil Cartwright	Uni	2025-09-14 20:52:14.822	2025-09-14 20:52:14.822	\N	\N
cmfk68zjl0005jm04o3q6hk6s	cmcl0reea0000f73ku9842dfd	Richard 	Uni	2025-09-14 20:52:45.589	2025-09-14 20:52:45.589	\N	\N
cmjohwn260001l8048fvtix9j	cmcl0reea0000f73ku9842dfd	Dipti	Local	2025-12-27 16:08:58.977	2025-12-27 16:08:58.977	\N	\N
cmdbtxd6q000dle04aj6aeb62	cmcl0reea0000f73ku9842dfd	Alpa	Escape	2025-07-20 15:26:14.017	2025-12-29 20:22:31.534	\N	great!
\.


--
-- Data for Name: Location; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Location" (id, "userId", name, type, address, description, website, "imageUrl", "createdAt", "updatedAt") FROM stdin;
cmjopr0cs0001l404qnvsb0ch	cmcl0reea0000f73ku9842dfd	Oxford and Cambridge club	Club				\N	2025-12-27 19:48:33.292	2025-12-27 19:48:33.292
cmjoud8pm0001jt045iimhjwy	cmcl0reea0000f73ku9842dfd	Kew Gardens	Venue				\N	2025-12-27 21:57:49.018	2025-12-27 21:57:49.018
cmjoudm1m0003jt045japz93g	cmcl0reea0000f73ku9842dfd	Tate Modern	Venue				\N	2025-12-27 21:58:06.298	2025-12-27 21:58:06.298
cmjoudxou0005jt04hxq3chqq	cmcl0reea0000f73ku9842dfd	Cambridge Society of London	Organization				\N	2025-12-27 21:58:21.296	2025-12-27 21:58:21.296
cmjouebqo0007jt04ug53kk0w	cmcl0reea0000f73ku9842dfd	Psychedelic society	Organization				\N	2025-12-27 21:58:39.6	2025-12-29 19:35:34.185
\.


--
-- Data for Name: Participation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Participation" (id, "userId", "friendId", "activityInstanceId", "createdAt") FROM stdin;
cmjrjbhdy0001lh048s3hmt9d	cmcl0reea0000f73ku9842dfd	cmdbtxd6q000dle04aj6aeb62	cmjriqc0p0001ju04qvwv6qm9	2025-12-29 19:11:49.702
cmjrjbhdy0002lh042pcxn9et	cmcl0reea0000f73ku9842dfd	cmdlo46920005l504sne696cy	cmjriqc0p0001ju04qvwv6qm9	2025-12-29 19:11:49.702
cmjrjbhdy0003lh044a3cqo14	cmcl0reea0000f73ku9842dfd	cme664nfn0007kz04izcgaizt	cmjriqc0p0001ju04qvwv6qm9	2025-12-29 19:11:49.702
cmjrjbhdy0004lh04yk0hqdd0	cmcl0reea0000f73ku9842dfd	cmdbtxd6q001dle04o1kx3gvr	cmjriqc0p0001ju04qvwv6qm9	2025-12-29 19:11:49.702
cmjrjbhdy0005lh049tnpits5	cmcl0reea0000f73ku9842dfd	cmjohwn260001l8048fvtix9j	cmjriqc0p0001ju04qvwv6qm9	2025-12-29 19:11:49.702
cmjrkcvq20003kw04ko9xhiwf	cmcl0reea0000f73ku9842dfd	cmdbtxd6q000dle04aj6aeb62	cmjrkcvq20001kw04t2ff5s3o	2025-12-29 19:40:54.555
cmjrkts320003jl04qpu1scb5	cmcl0reea0000f73ku9842dfd	cme6667tr000bkz04cuz5t0aj	cmjrkts320001jl04sfuk1zud	2025-12-29 19:54:02.99
\.


--
-- Data for Name: PublicRSVP; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PublicRSVP" (id, "activityInstanceId", name, email, phone, message, "createdAt", "friendId") FROM stdin;
cmjrirqvb0001jy045xmriuke	cmjriqc0p0001ju04qvwv6qm9	Beth Butler	\N	9879878979	\N	2025-12-29 18:56:28.872	cme664nfn0007kz04izcgaizt
cmjrisq050003jy04jb1jkjlq	cmjriqc0p0001ju04qvwv6qm9	Elon Musk	\N	979079878	\N	2025-12-29 18:57:14.405	\N
cmjritlya0007ju042cl05b44	cmjriqc0p0001ju04qvwv6qm9	Sam Smith	\N	98798789	i dont eat shellfish	2025-12-29 18:57:55.81	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, password, "createdAt", "updatedAt", "profilePicture", timezone, preferences, "googleApiKey") FROM stdin;
cmcl0reea0000f73ku9842dfd	Kulwinder Singh	kuli.singh@gmail.com	$2a$12$lqRz49fDxd4XdwIl9iIt0.9f42IeqxpXQsAjT/ePsDhoAURovZ51a	2025-07-01 21:07:46.211	2025-12-29 19:36:34.395	\N	\N	{"systemPrompt": "1. Suggest 3-4 diverse, REAL, CONCRETE event options matching the request happening around the Current Date.\\n2. Use Google Search to verify if events are actually happening. Do not hallucinate.\\n3. CRITICAL: You MUST provide a valid 'url' for EVERY event found. Use the link from the Google Search result.\\n4. SAVED LOCATION LOGIC:\\n   - Prioritize saved locations/activities ONLY IF they explicitly match the user's requested activity category.\\n   - Example: Do NOT suggest a restaurant (Saved Location) if the user asks for a 'Gig' or 'Concert'.\\n   - If no Saved Location matches the specific activity type, you MUST search for external venues instead.\\n5. LOCATION SELECTION LOGIC:\\n   - If the user specifies a location in the request, use that.\\n   - If the request implies TRAVEL (flight, holiday, getaway), treat 'HOME / ORIGIN' as the DEPARTURE point.\\n   - If the request implies LOCAL NATURE (hiking, walks), use 'HOME / ORIGIN'.\\n   - If the request implies URBAN SOCIALIZING (dinner, theatre, cinema), use 'SOCIAL HUB' unless stated otherwise.", "preferredModel": "gemini-2.5-flash-lite", "socialLocation": "Central London, UK", "defaultLocation": "Richmond, Surrey, UK", "enableGoogleSearch": true}	\N
\.


--
-- Name: ActivityInstance ActivityInstance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityInstance"
    ADD CONSTRAINT "ActivityInstance_pkey" PRIMARY KEY (id);


--
-- Name: ActivityValue ActivityValue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityValue"
    ADD CONSTRAINT "ActivityValue_pkey" PRIMARY KEY (id);


--
-- Name: Activity Activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_pkey" PRIMARY KEY (id);


--
-- Name: CoreValue CoreValue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CoreValue"
    ADD CONSTRAINT "CoreValue_pkey" PRIMARY KEY (id);


--
-- Name: Friend Friend_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Friend"
    ADD CONSTRAINT "Friend_pkey" PRIMARY KEY (id);


--
-- Name: Location Location_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Location"
    ADD CONSTRAINT "Location_pkey" PRIMARY KEY (id);


--
-- Name: Participation Participation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Participation"
    ADD CONSTRAINT "Participation_pkey" PRIMARY KEY (id);


--
-- Name: PublicRSVP PublicRSVP_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PublicRSVP"
    ADD CONSTRAINT "PublicRSVP_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: ActivityInstance_activityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityInstance_activityId_idx" ON public."ActivityInstance" USING btree ("activityId");


--
-- Name: ActivityInstance_datetime_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityInstance_datetime_idx" ON public."ActivityInstance" USING btree (datetime);


--
-- Name: ActivityInstance_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityInstance_userId_idx" ON public."ActivityInstance" USING btree ("userId");


--
-- Name: ActivityValue_activityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityValue_activityId_idx" ON public."ActivityValue" USING btree ("activityId");


--
-- Name: ActivityValue_activityId_valueId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ActivityValue_activityId_valueId_key" ON public."ActivityValue" USING btree ("activityId", "valueId");


--
-- Name: ActivityValue_valueId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityValue_valueId_idx" ON public."ActivityValue" USING btree ("valueId");


--
-- Name: Activity_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Activity_userId_idx" ON public."Activity" USING btree ("userId");


--
-- Name: CoreValue_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CoreValue_userId_idx" ON public."CoreValue" USING btree ("userId");


--
-- Name: CoreValue_userId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CoreValue_userId_name_key" ON public."CoreValue" USING btree ("userId", name);


--
-- Name: Friend_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Friend_userId_idx" ON public."Friend" USING btree ("userId");


--
-- Name: Location_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Location_userId_idx" ON public."Location" USING btree ("userId");


--
-- Name: Participation_activityInstanceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Participation_activityInstanceId_idx" ON public."Participation" USING btree ("activityInstanceId");


--
-- Name: Participation_friendId_activityInstanceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Participation_friendId_activityInstanceId_key" ON public."Participation" USING btree ("friendId", "activityInstanceId");


--
-- Name: Participation_friendId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Participation_friendId_idx" ON public."Participation" USING btree ("friendId");


--
-- Name: Participation_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Participation_userId_idx" ON public."Participation" USING btree ("userId");


--
-- Name: PublicRSVP_activityInstanceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PublicRSVP_activityInstanceId_idx" ON public."PublicRSVP" USING btree ("activityInstanceId");


--
-- Name: PublicRSVP_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PublicRSVP_createdAt_idx" ON public."PublicRSVP" USING btree ("createdAt");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: ActivityInstance ActivityInstance_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityInstance"
    ADD CONSTRAINT "ActivityInstance_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public."Activity"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ActivityInstance ActivityInstance_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityInstance"
    ADD CONSTRAINT "ActivityInstance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Location"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ActivityInstance ActivityInstance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityInstance"
    ADD CONSTRAINT "ActivityInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ActivityValue ActivityValue_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityValue"
    ADD CONSTRAINT "ActivityValue_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public."Activity"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ActivityValue ActivityValue_valueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityValue"
    ADD CONSTRAINT "ActivityValue_valueId_fkey" FOREIGN KEY ("valueId") REFERENCES public."CoreValue"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Activity Activity_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CoreValue CoreValue_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CoreValue"
    ADD CONSTRAINT "CoreValue_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Friend Friend_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Friend"
    ADD CONSTRAINT "Friend_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Location Location_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Location"
    ADD CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Participation Participation_activityInstanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Participation"
    ADD CONSTRAINT "Participation_activityInstanceId_fkey" FOREIGN KEY ("activityInstanceId") REFERENCES public."ActivityInstance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Participation Participation_friendId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Participation"
    ADD CONSTRAINT "Participation_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES public."Friend"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Participation Participation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Participation"
    ADD CONSTRAINT "Participation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PublicRSVP PublicRSVP_activityInstanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PublicRSVP"
    ADD CONSTRAINT "PublicRSVP_activityInstanceId_fkey" FOREIGN KEY ("activityInstanceId") REFERENCES public."ActivityInstance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ND9oag0crR8xshroJ8O2rYfamPlPd7yU7dPPFQ09OgY5v9FdOM9adf2s1ebPRU9

