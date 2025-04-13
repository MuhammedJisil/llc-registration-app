--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6
-- Dumped by pg_dump version 16.6

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

--
-- Name: create_admin_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_admin_notification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Create notification for new registration
    INSERT INTO admin_notifications (
        user_id, 
        registration_id, 
        type, 
        message
    ) VALUES (
        NEW.user_id,
        NEW.id,
        'new_registration',
        CONCAT('New LLC Registration: ', NEW.company_name, ' by ', 
               (SELECT full_name FROM users WHERE id = NEW.user_id))
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_admin_notification() OWNER TO postgres;

--
-- Name: create_new_user_signup_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_new_user_signup_notification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Create notification for new user signup
    INSERT INTO admin_notifications (
        user_id, 
        registration_id, 
        type, 
        message,
        is_read
    ) VALUES (
        NEW.id,
        NULL,  -- Explicitly set to NULL for new user signup
        'new_user_signup',
        CONCAT('New User Signup: ', NEW.full_name, ' (', NEW.email, ')'),
        false  -- Ensure new notifications are unread
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_new_user_signup_notification() OWNER TO postgres;

--
-- Name: create_payment_notification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_payment_notification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
        INSERT INTO admin_notifications (
            user_id, 
            registration_id, 
            type, 
            message
        ) VALUES (
            NEW.user_id,
            NEW.id,
            'payment_completed',
            CONCAT('Payment Completed for ', NEW.company_name, ' by ', 
                   (SELECT full_name FROM users WHERE id = NEW.user_id))
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_payment_notification() OWNER TO postgres;

--
-- Name: update_user_new_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user_new_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only update users if their is_new_user status needs to change
    UPDATE users 
    SET is_new_user = false
    WHERE is_new_user = true 
      AND (
        created_at < NOW() - INTERVAL '3 days'  -- Older than 3 days
        OR id IN (SELECT DISTINCT user_id FROM llc_registrations)
      )
      AND is_new_user IS DISTINCT FROM false; -- Prevent unnecessary updates

    RETURN NULL; -- Avoid triggering further updates
END;
$$;


ALTER FUNCTION public.update_user_new_status() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    registration_id integer,
    type character varying(50) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_notifications OWNER TO postgres;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_notifications_id_seq OWNER TO postgres;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_notifications_id_seq OWNED BY public.admin_notifications.id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    role character varying(20) DEFAULT 'admin'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: business_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.business_categories OWNER TO postgres;

--
-- Name: business_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.business_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.business_categories_id_seq OWNER TO postgres;

--
-- Name: business_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.business_categories_id_seq OWNED BY public.business_categories.id;


--
-- Name: identification_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.identification_documents (
    id integer NOT NULL,
    registration_id integer NOT NULL,
    document_type character varying(50) NOT NULL,
    file_path character varying(255) NOT NULL,
    file_name character varying(255) NOT NULL,
    id_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.identification_documents OWNER TO postgres;

--
-- Name: identification_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.identification_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.identification_documents_id_seq OWNER TO postgres;

--
-- Name: identification_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.identification_documents_id_seq OWNED BY public.identification_documents.id;


--
-- Name: llc_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.llc_addresses (
    id integer NOT NULL,
    registration_id integer NOT NULL,
    street character varying(255) NOT NULL,
    city character varying(100) NOT NULL,
    state_province character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    country character varying(100) DEFAULT 'United States'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.llc_addresses OWNER TO postgres;

--
-- Name: llc_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.llc_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.llc_addresses_id_seq OWNER TO postgres;

--
-- Name: llc_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.llc_addresses_id_seq OWNED BY public.llc_addresses.id;


--
-- Name: llc_owners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.llc_owners (
    id integer NOT NULL,
    registration_id integer NOT NULL,
    full_name character varying(255) NOT NULL,
    ownership_percentage numeric(5,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.llc_owners OWNER TO postgres;

--
-- Name: llc_owners_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.llc_owners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.llc_owners_id_seq OWNER TO postgres;

--
-- Name: llc_owners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.llc_owners_id_seq OWNED BY public.llc_owners.id;


--
-- Name: llc_registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.llc_registrations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    registration_number character varying(50),
    company_name character varying(255),
    company_type character varying(50) DEFAULT 'LLC'::character varying,
    category_id integer,
    state character varying(50),
    filing_fee numeric(10,2),
    status character varying(50) DEFAULT 'draft'::character varying,
    current_step integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_status character varying(50) DEFAULT 'unpaid'::character varying
);


ALTER TABLE public.llc_registrations OWNER TO postgres;

--
-- Name: llc_registrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.llc_registrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.llc_registrations_id_seq OWNER TO postgres;

--
-- Name: llc_registrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.llc_registrations_id_seq OWNED BY public.llc_registrations.id;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO postgres;

--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    registration_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'stripe'::character varying,
    stripe_payment_id character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: registration_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registration_files (
    id integer NOT NULL,
    registration_id integer NOT NULL,
    file_url character varying(500) NOT NULL,
    file_name character varying(255) NOT NULL,
    public_id character varying(255) NOT NULL,
    resource_type character varying(50) DEFAULT 'image'::character varying,
    file_type character varying(50),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.registration_files OWNER TO postgres;

--
-- Name: registration_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.registration_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registration_files_id_seq OWNER TO postgres;

--
-- Name: registration_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.registration_files_id_seq OWNED BY public.registration_files.id;


--
-- Name: registration_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registration_notifications (
    id integer NOT NULL,
    registration_id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    message_type character varying(50) NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.registration_notifications OWNER TO postgres;

--
-- Name: registration_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.registration_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registration_notifications_id_seq OWNER TO postgres;

--
-- Name: registration_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.registration_notifications_id_seq OWNED BY public.registration_notifications.id;


--
-- Name: state_fees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.state_fees (
    id integer NOT NULL,
    state_name character varying(50) NOT NULL,
    fee numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.state_fees OWNER TO postgres;

--
-- Name: state_fees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.state_fees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.state_fees_id_seq OWNER TO postgres;

--
-- Name: state_fees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.state_fees_id_seq OWNED BY public.state_fees.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255),
    google_id character varying(255),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    google_profile_picture text,
    is_new_user boolean DEFAULT true,
    first_registration_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admin_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications ALTER COLUMN id SET DEFAULT nextval('public.admin_notifications_id_seq'::regclass);


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: business_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_categories ALTER COLUMN id SET DEFAULT nextval('public.business_categories_id_seq'::regclass);


--
-- Name: identification_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.identification_documents ALTER COLUMN id SET DEFAULT nextval('public.identification_documents_id_seq'::regclass);


--
-- Name: llc_addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_addresses ALTER COLUMN id SET DEFAULT nextval('public.llc_addresses_id_seq'::regclass);


--
-- Name: llc_owners id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_owners ALTER COLUMN id SET DEFAULT nextval('public.llc_owners_id_seq'::regclass);


--
-- Name: llc_registrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_registrations ALTER COLUMN id SET DEFAULT nextval('public.llc_registrations_id_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: registration_files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_files ALTER COLUMN id SET DEFAULT nextval('public.registration_files_id_seq'::regclass);


--
-- Name: registration_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_notifications ALTER COLUMN id SET DEFAULT nextval('public.registration_notifications_id_seq'::regclass);


--
-- Name: state_fees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_fees ALTER COLUMN id SET DEFAULT nextval('public.state_fees_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: business_categories business_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_categories
    ADD CONSTRAINT business_categories_pkey PRIMARY KEY (id);


--
-- Name: identification_documents identification_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.identification_documents
    ADD CONSTRAINT identification_documents_pkey PRIMARY KEY (id);


--
-- Name: llc_addresses llc_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_addresses
    ADD CONSTRAINT llc_addresses_pkey PRIMARY KEY (id);


--
-- Name: llc_owners llc_owners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_owners
    ADD CONSTRAINT llc_owners_pkey PRIMARY KEY (id);


--
-- Name: llc_registrations llc_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_registrations
    ADD CONSTRAINT llc_registrations_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_token_key UNIQUE (token);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: registration_files registration_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_files
    ADD CONSTRAINT registration_files_pkey PRIMARY KEY (id);


--
-- Name: registration_notifications registration_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_notifications
    ADD CONSTRAINT registration_notifications_pkey PRIMARY KEY (id);


--
-- Name: state_fees state_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_fees
    ADD CONSTRAINT state_fees_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_admins_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admins_username ON public.admins USING btree (username);


--
-- Name: llc_registrations new_registration_notification; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER new_registration_notification AFTER INSERT ON public.llc_registrations FOR EACH ROW EXECUTE FUNCTION public.create_admin_notification();


--
-- Name: users new_user_signup_notification; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER new_user_signup_notification AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.create_new_user_signup_notification();


--
-- Name: llc_registrations payment_status_notification; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER payment_status_notification AFTER UPDATE ON public.llc_registrations FOR EACH ROW EXECUTE FUNCTION public.create_payment_notification();


--
-- Name: llc_registrations update_new_user_status_on_registration; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_new_user_status_on_registration AFTER INSERT ON public.llc_registrations FOR EACH STATEMENT EXECUTE FUNCTION public.update_user_new_status();


--
-- Name: users update_new_user_status_on_user_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_new_user_status_on_user_update AFTER UPDATE OF is_new_user ON public.users FOR EACH ROW WHEN ((old.is_new_user IS DISTINCT FROM new.is_new_user)) EXECUTE FUNCTION public.update_user_new_status();


--
-- Name: llc_registrations user_registrations_viewed; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER user_registrations_viewed AFTER INSERT ON public.llc_registrations FOR EACH ROW EXECUTE FUNCTION public.update_user_new_status();


--
-- Name: admin_notifications admin_notifications_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.llc_registrations(id) ON DELETE CASCADE;


--
-- Name: admin_notifications admin_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: llc_owners fk_registration; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_owners
    ADD CONSTRAINT fk_registration FOREIGN KEY (registration_id) REFERENCES public.llc_registrations(id);


--
-- Name: llc_addresses fk_registration; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_addresses
    ADD CONSTRAINT fk_registration FOREIGN KEY (registration_id) REFERENCES public.llc_registrations(id);


--
-- Name: payments fk_registration; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_registration FOREIGN KEY (registration_id) REFERENCES public.llc_registrations(id);


--
-- Name: llc_registrations fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_registrations
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: identification_documents identification_documents_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.identification_documents
    ADD CONSTRAINT identification_documents_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.llc_registrations(id) ON DELETE CASCADE;


--
-- Name: llc_registrations llc_registrations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_registrations
    ADD CONSTRAINT llc_registrations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.business_categories(id);


--
-- Name: llc_registrations llc_registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.llc_registrations
    ADD CONSTRAINT llc_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: registration_files registration_files_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_files
    ADD CONSTRAINT registration_files_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.llc_registrations(id) ON DELETE CASCADE;


--
-- Name: registration_notifications registration_notifications_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_notifications
    ADD CONSTRAINT registration_notifications_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.llc_registrations(id) ON DELETE CASCADE;


--
-- Name: registration_notifications registration_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registration_notifications
    ADD CONSTRAINT registration_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

