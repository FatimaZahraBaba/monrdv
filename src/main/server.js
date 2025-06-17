const startLocalServer = () => {
    const { Bonjour } = require('bonjour-service');
    const http = require('http');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const cors = require('cors')
    const mysql = require('mysql2/promise');
    const { Server: SocketServer } = require('socket.io')

    const db = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'erraji-semelle',
        waitForConnections: true,
        connectionLimit: 10, // Limite le nombre de connexions simultanées
        queueLimit: 0
    })

    const JWT_SECRET = 'b1f9832d876a71e420d7ca017c6d42411788c406dc60f8cf109e8800c7a0e0afb1a0e6077c01f44d6ef05b582b2ba6668e4b6bdb695abeec20510de4b0205b3c';
    const express = require('express');

    // Initialize Express
    const PORT = 4000;
    const app = express();
    app.use(cors())

    const server = http.createServer(app)
    const io = new SocketServer(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        }
    });

    app.use(express.json());

    db.query('ALTER TABLE appointments ADD COLUMN quote_date DATE AFTER quote_num')
        .catch(err => console.log("Erreur lors de l'ajout de la colonne quote_date :", err));
    db.query('ALTER TABLE appointments ADD COLUMN invoice_date DATE AFTER invoice_num')
        .catch(err => console.log("Erreur lors de l'ajout de la colonne invoice_date :", err));
    db.query('ALTER TABLE mutuals ADD COLUMN `order` INT UNSIGNED NOT NULL DEFAULT 0')
        .catch(err => console.log("Erreur lors de l'ajout de la colonne `order` :", err));

    /* ─────────────────────────────────────────── */
    /*           AUTHENTIFICATION                  */
    /* ─────────────────────────────────────────── */

    app.post("/login", async (req, res) => {
        const { username, password } = req.body;

        try {
            const [users] = await db.query("SELECT * FROM users WHERE username LIKE ? AND active = 1", [username]);

            if (users.length === 0) return res.status(404).json({
                error: "Utilisateur non trouvé",
            });

            const user = users[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({
                error: "Mot de passe incorrect",
            });

            delete user.password;
            const roles = user.roles ? typeof user.roles == "string" ? JSON.parse(user.roles) : user.roles : {};
            const token = jwt.sign({ id: user.id }, JWT_SECRET);
            res.json({ ...user, roles, token });
        } catch (err) {
            res.status(500).json({
                error: "Erreur lors de l'authentification",
                details: err.message
            });
        }
    });

    /* ─────────────────────────────────────────── */
    /*                MIDDLEWARE                   */
    /* ─────────────────────────────────────────── */

    io.use((socket, next) => {
        const token = socket.handshake.auth.token

        if (!token) {
            return next(new Error("Accès refusé, token manquant"))
        }

        try {
            const verified = jwt.verify(token, JWT_SECRET);
            socket.user = verified;
            next()
        } catch (err) {
            return next(new Error("Token invalide"))
        }
    })

    app.use((req, res, next) => {
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) return res.status(401).json({ error: "Accès refusé, token manquant" });

        try {
            const verified = jwt.verify(token, JWT_SECRET);
            req.user = verified;
            next();
        } catch (err) {
            res.status(403).json({
                error: "Token invalide",
                details: err.message
            });
        }
    })

    /* ─────────────────────────────────────────── */
    /*                 USERS                       */
    /* ─────────────────────────────────────────── */

    // Récupérer tous les utilisateurs
    app.get('/users', async (req, res) => {
        try {
            const [rows] = await db.query('SELECT id, username, is_admin, active, roles FROM users');

            const users = rows.map(user => ({
                ...user,
                roles: typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles
            }));

            res.json(users);
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({
                error: 'Erreur lors de la récupération des utilisateurs',
                details: err.message
            });
        }
    });

    // Ajouter un utilisateur
    app.post('/users', async (req, res) => {
        try {
            const { username, password, is_admin, active, roles } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Le nom d\'utilisateur et le mot de passe sont obligatoires' });
            }

            // check if the username is already taken
            const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Nom d\'utilisateur déjà pris' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await db.query('INSERT INTO users (username, password, is_admin, active, roles) VALUES (?, ?, ?, ?, ?)', [username, hashedPassword, is_admin, active, JSON.stringify(roles)]);

            res.status(201).json({ message: 'Utilisateur ajouté', id: result.insertId });
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'utilisateur', details: err.message });
        }
    });

    // Mettre à jour un utilisateur

    app.put("/users/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const { username, password, is_admin, active, roles } = req.body;

            if (!username) {
                return res.status(400).json({ error: "Le nom d'utilisateur est obligatoire" });
            }

            // Fetch the existing user
            const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
            if (userRows.length === 0) {
                return res.status(404).json({ error: "Utilisateur non trouvé" });
            }

            // Check if the username is already taken
            const [existingUsers] = await db.query("SELECT id FROM users WHERE username = ? AND id != ?", [username, id]);
            if (existingUsers.length > 0) {
                return res.status(400).json({ error: "Nom d'utilisateur déjà pris" });
            }

            let updateQuery = "UPDATE users SET username = ?, is_admin = ?, active = ?, roles = ?";
            let queryParams = [username, is_admin, active, JSON.stringify(roles)];

            // Update password only if provided
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateQuery += ", password = ?";
                queryParams.push(hashedPassword);
            }

            updateQuery += " WHERE id = ?";
            queryParams.push(id);

            const [result] = await db.query(updateQuery, queryParams);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Aucune mise à jour effectuée" });
            }

            res.json({ message: "Utilisateur mis à jour avec succès" });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur", details: err.message });
        }
    });

    // Supprimer un utilisateur
    app.delete('/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }
            res.json({ message: 'Utilisateur supprimé' });
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur', details: err.message });
        }
    });

    /* ─────────────────────────────────────────── */
    /*                 PATIENTS                    */
    /* ─────────────────────────────────────────── */

    // Récupérer tous les patients
    app.get('/patients', async (req, res) => {
        try {
            const { name, status, workshop_status, mutual, favorite, has_note, daterange, page } = req.query;

            const selectPart = `
                SELECT
                    p.*,
                    CONCAT(p.last_name, ' ', p.first_name) AS name,
                    a.last_appointment_date,
                    a.last_appointment_id,
                    (SELECT status FROM status WHERE appointment_id = last_appointment_id ORDER BY id DESC LIMIT 1) AS last_appointment_status,
                    (SELECT positif_molding FROM appointments WHERE id = last_appointment_id) AS last_appointment_positive_molding,
                    (SELECT absent FROM appointments WHERE id = last_appointment_id) AS last_appointment_absent,
                    (SELECT workshop_status FROM appointments WHERE id = last_appointment_id) AS workshop_status,
                    m.name AS mutual_name,
                    uc.username AS created_by,
                    uu.username AS updated_by
                FROM patients p
                LEFT JOIN (
                    SELECT patient_id, MAX(date) AS last_appointment_date, MAX(id) as last_appointment_id
                    FROM appointments a
                    GROUP BY patient_id
                ) a ON p.id = a.patient_id
                LEFT JOIN mutuals m ON p.mutual_id = m.id
                LEFT JOIN users uc ON p.created_by = uc.id
                LEFT JOIN users uu ON p.updated_by = uu.id
            `

            let conditionPart = "";
            const queryParams = [];

            const WHERE = conditionPart => conditionPart.includes('HAVING') ? ' AND' : ' HAVING';

            if (name) {
                conditionPart += `${WHERE(conditionPart)} (
                    p.first_name LIKE ?
                    OR p.last_name LIKE ?
                    OR REPLACE(p.phone, ' ', '') LIKE REPLACE(?, ' ', '')
                    OR REPLACE(p.phone2, ' ', '') LIKE REPLACE(?, ' ', '')
                )`;
                queryParams.push(`%${name}%`, `%${name}%`, `%${name}%`, `%${name}%`);
            }

            if (status) {
                conditionPart += `${WHERE(conditionPart)} (
                    (SELECT status FROM appointments WHERE patient_id = p.id ORDER BY id DESC LIMIT 1) = ?
                )`;
                queryParams.push(status);
            }

            if (workshop_status) {
                if (workshop_status == "not_sent") {
                    conditionPart += `${WHERE(conditionPart)} (
                        (SELECT workshop_status FROM appointments WHERE patient_id = p.id ORDER BY id DESC LIMIT 1) IS NULL
                    )`;
                }
                else {
                    conditionPart += `${WHERE(conditionPart)} (
                    (SELECT workshop_status FROM appointments WHERE patient_id = p.id ORDER BY id DESC LIMIT 1) = ?
                )`;
                    queryParams.push(workshop_status);
                }
            }

            if (mutual) {
                if (mutual == "all") {
                    conditionPart += `${WHERE(conditionPart)} p.mutual_id IS NOT NULL`;
                }
                else if (mutual == "none") {
                    conditionPart += `${WHERE(conditionPart)} p.mutual_id IS NULL`;
                }
                else {
                    conditionPart += `${WHERE(conditionPart)} p.mutual_id = ?`;
                    queryParams.push(mutual);
                }
            }

            if (favorite) {
                if (favorite == "yes") {
                    conditionPart += `${WHERE(conditionPart)} p.favorite = 1`;
                }
                else {
                    conditionPart += `${WHERE(conditionPart)} p.favorite = 0`;
                }
            }

            if (has_note) {
                if (has_note == "yes") {
                    conditionPart += `${WHERE(conditionPart)} p.note IS NOT NULL AND p.note != ''`;
                }
                else {
                    conditionPart += `${WHERE(conditionPart)} p.note IS NULL OR p.note = ''`;
                }
            }

            if (daterange?.to) {
                const { from, to } = daterange;
                conditionPart += `${WHERE(conditionPart)} p.created_at BETWEEN ? AND ?`;
                queryParams.push(from, to);
            }
            else if (daterange?.from) {
                conditionPart += `${WHERE(conditionPart)} p.created_at >= ?`;
                queryParams.push(daterange.from);
            }

            conditionPart += ' ORDER BY p.id DESC';

            const [countQuery] = await db.query(`SELECT COUNT(*) as count FROM patients p ${conditionPart.replace("HAVING", "WHERE")}`, queryParams);
            const totalCount = countQuery[0].count;

            // Pagination
            const pageSize = 100;
            if (page) {
                const offset = (page - 1) * pageSize;
                conditionPart += ` LIMIT ${pageSize} OFFSET ${offset}`;
            }

            let query = `${selectPart} ${conditionPart}`;
            const [rows] = await db.query(query, queryParams);

            res.json({
                data: rows,
                activePage: page ? Number(page) : 1,
                pagesNumber: Math.ceil(totalCount / pageSize),
                count: totalCount
            });
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({
                error: 'Erreur lors de la récupération des patients',
                details: err.message
            });
        }
    });

    // Récupérer un patient
    app.get('/patients/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const query = `SELECT * FROM patients WHERE id = ?`;
            const [rows] = await db.query(query, [id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Patient non trouvé' });
            }

            res.json(rows[0]); // Return only the first result since it's a single patient
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({
                error: 'Erreur lors de la récupération du patient',
                details: err.message
            });
        }
    });

    // Ajouter un patient
    app.post('/patients', async (req, res) => {
        try {
            const { first_name, last_name, phone, phone2, address, cin, note, mutual_id, favorite } = req.body;

            if (!first_name || !last_name || !phone || !address) {
                return res.status(400).json({ error: 'Le nom, le téléphone et l\'adresse sont obligatoires' });
            }

            const [result] = await db.query(
                'INSERT INTO patients (first_name, last_name, phone, phone2, cin, address, note, mutual_id, favorite, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [first_name, last_name, phone, phone2, cin || null, address || null, note || null, mutual_id || null, favorite || 0, req.user.id]
            );

            res.status(201).json({ message: 'Patient ajouté', id: result.insertId });
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de l\'ajout du patient', details: err.message });
        }
    });

    // Mettre à jour un patient
    app.put('/patients/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { first_name, last_name, phone, phone2, address, cin, note, mutual_id, favorite } = req.body;

            if (!first_name || !last_name || !phone || !address) {
                return res.status(400).json({ error: 'Le nom, le téléphone et l\'adresse sont obligatoires' });
            }

            const [result] = await db.query(
                'UPDATE patients SET first_name = ?, last_name = ?, phone = ?, phone2 = ?, cin = ?, address = ?, note = ?, mutual_id = ?, favorite = ?, updated_by = ? WHERE id = ?',
                [first_name, last_name, phone, phone2, cin || null, address || null, note || null, mutual_id || null, favorite || 0, req.user.id, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Patient non trouvé' });
            }

            res.json({ message: 'Patient mis à jour' });
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du patient', details: err.message });
        }
    });

    app.put('/patients/:id/favorite', async (req, res) => {
        try {
            const { id } = req.params;
            const { favorite } = req.body;

            if (favorite === undefined) {
                return res.status(400).json({ error: 'Le statut favori est obligatoire' });
            }

            const [result] = await db.query(
                'UPDATE patients SET favorite = ? WHERE id = ?',
                [favorite, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Patient non trouvé' });
            }

            res.json({ message: 'Statut favori mis à jour' });
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du statut favori', details: err.message });
        }
    })

    // Supprimer un patient
    app.delete('/patients/:id', async (req, res) => {
        let connection;
        try {
            const id = Number(req.params.id);
            if (!id) return res.status(400).json({ error: 'Invalid patient ID' });

            // Get a connection from the pool
            connection = await db.getConnection();

            // Start the transaction
            await connection.beginTransaction();

            // Delete patient's payments
            await connection.execute('DELETE FROM payments WHERE appointment_id IN (SELECT id FROM appointments WHERE patient_id = ?)', [id]);

            // Delete patient's status
            await connection.execute('DELETE FROM status WHERE appointment_id IN (SELECT id FROM appointments WHERE patient_id = ?)', [id]);

            // Delete patient's appointments
            await connection.execute('DELETE FROM appointments WHERE patient_id = ?', [id]);

            // Delete the patient
            const [result] = await connection.execute('DELETE FROM patients WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                throw new Error('Patient non trouvé');
            }

            // Commit the transaction
            await connection.commit();
            res.json({ message: 'Patient supprimé' });
        } catch (err) {
            if (connection) await connection.rollback();
            console.error('Erreur SQL:', err);
            res.status(err.message === 'Patient non trouvé' ? 404 : 500).json({
                error: err.message,
                details: err.message
            });
        } finally {
            if (connection) connection.release(); // Release connection back to the pool
        }
    });

    /* ─────────────────────────────────────────── */
    /*               APPOINTMENTS                  */
    /* ─────────────────────────────────────────── */

    // Récupérer tous les rendez-vous
    app.get('/appointments', async (req, res) => {
        try {
            const { daterange, name, workshop_status, status, is_paid, is_positive_molding } = req.query;

            let query = `
                SELECT
                    a.id,
                    a.patient_id,
                    a.doctor_id,
                    a.service_id,
                    a.date,
                    a.created_at,
                    a.updated_at,
                    CAST(a.price AS CHAR) AS price,
                    IFNULL((SELECT SUM(amount) FROM payments WHERE appointment_id = a.id), 0) as advance,
                    (a.price - IFNULL((SELECT SUM(amount) FROM payments WHERE appointment_id = a.id), 0)) AS reste,
                    (a.price = IFNULL((SELECT SUM(amount) FROM payments WHERE appointment_id = a.id), 0)) AS paid,
                    a.positif_molding,
                    a.absent,
                    a.status,
                    a.workshop_status,
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    CONCAT(p.last_name, ' ', p.first_name) AS patient_name,
                    p.phone AS patient_phone,
                    p.phone2 AS patient_phone2,
                    p.address AS patient_address,
                    p.note AS patient_note,
                    d.name AS doctor_name,
                    s.name AS service_name,
                    m.id AS mutual_id,
                    m.name AS mutual_name,
                    uc.username AS created_by,
                    uu.username AS updated_by
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id
                LEFT JOIN doctors d ON a.doctor_id = d.id
                LEFT JOIN services s ON a.service_id = s.id
                LEFT JOIN mutuals m ON p.mutual_id = m.id
                LEFT JOIN users uc ON a.created_by = uc.id
                LEFT JOIN users uu ON a.updated_by = uu.id
            `;

            const queryParams = [];

            const WHERE = query => query.includes('HAVING') ? ' AND' : ' HAVING';

            if (daterange?.to) {
                const { from, to } = daterange;
                query += `${WHERE(query)} (a.status = 'instance' OR (a.status != 'instance' AND a.date BETWEEN ? AND ?))`;
                queryParams.push(from, to);
            }
            else if (daterange?.from) {
                query += `${WHERE(query)} (a.status = 'instance' OR (a.status != 'instance' AND a.date >= ?))`;
                queryParams.push(daterange?.from);
            }

            if (name) {
                query += `${WHERE(query)} (
                    patient_first_name LIKE ?
                    OR patient_last_name LIKE ?
                    OR REPLACE(patient_phone, ' ', '') LIKE REPLACE(?, ' ', '')
                    OR REPLACE(patient_phone2, ' ', '') LIKE REPLACE(?, ' ', '')
                )`;
                queryParams.push(`%${name}%`, `%${name}%`, `%${name}%`, `%${name}%`);
            }

            if (status) {
                query += `${WHERE(query)} a.status = ?`;
                queryParams.push(status);
            }

            if (workshop_status) {
                if (workshop_status == "not_sent") {
                    query += `${WHERE(query)} a.workshop_status IS NULL`;
                }
                else {
                    query += `${WHERE(query)} a.workshop_status = ?`;
                    queryParams.push(workshop_status);
                }
            }

            if (is_paid) {
                query += `${WHERE(query)} paid = ?`;
                queryParams.push(is_paid == "yes" ? 1 : 0);
            }

            if (is_positive_molding) {
                query += `${WHERE(query)} a.positif_molding = ?`;
                queryParams.push(is_positive_molding == "yes" ? 1 : 0);
            }

            query += ' ORDER BY a.id DESC';

            const [rows] = await db.query(query, queryParams);

            if (rows.length) {
                const [payments] = await db.query(
                    `
                        SELECT
                            p.*,
                            p.created_at,
                            p.updated_at,
                            uc.username AS created_by,
                            uu.username AS updated_by
                        FROM payments p
                        LEFT JOIN users uc ON p.created_by = uc.id
                        LEFT JOIN users uu ON p.updated_by = uu.id
                        WHERE appointment_id IN (?)
                    `,
                    [rows.map(row => row.id)]
                );

                const paymentsMap = {};
                payments.forEach(payment => {
                    if (!paymentsMap[payment.appointment_id]) {
                        paymentsMap[payment.appointment_id] = [];
                    }
                    paymentsMap[payment.appointment_id].push(payment);
                });

                const [statusList] = await db.query(
                    `
                        SELECT
                            s.*,
                            s.created_at,
                            s.updated_at,
                            uc.username AS created_by,
                            uu.username AS updated_by
                        FROM status s
                        LEFT JOIN users uc ON s.created_by = uc.id
                        LEFT JOIN users uu ON s.updated_by = uu.id
                        WHERE appointment_id IN (?)
                    `,
                    [rows.map(row => row.id)]
                );

                const statusMap = {};
                statusList.forEach(status => {
                    if (!statusMap[status.appointment_id]) {
                        statusMap[status.appointment_id] = [];
                    }
                    statusMap[status.appointment_id].push(status);
                });

                rows.forEach(row => {
                    row.payments = paymentsMap[row.id] || [];
                    row.statusList = statusMap[row.id] || [];
                })
            }

            res.json(rows);
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous', details: err.message });
        }
    });

    app.get('/appointments/payments', async (req, res) => {
        try {
            const { daterange, name, mutual, status, service, billed, page } = req.query;

            const joinPart = `
                LEFT JOIN patients p ON a.patient_id = p.id
                LEFT JOIN doctors d ON a.doctor_id = d.id
                LEFT JOIN services s ON a.service_id = s.id
                LEFT JOIN mutuals m ON p.mutual_id = m.id
            `;

            // 1. Fetch appointment records
            let appointmentsQuery = `
                SELECT
                    a.id,
                    CONCAT(p.last_name, ' ', p.first_name) AS name,
                    p.phone,
                    p.phone2,
                    a.date,
                    a.status,
                    a.price,
                    IFNULL((SELECT SUM(amount) FROM payments WHERE appointment_id = a.id), 0) as advance,
                    (a.price - IFNULL((SELECT SUM(amount) FROM payments WHERE appointment_id = a.id), 0)) AS reste,
                    (a.price = IFNULL((SELECT SUM(amount) FROM payments WHERE appointment_id = a.id), 0)) AS paid,
                    a.positif_molding,
                    a.absent,
                    a.invoice_num,
                    a.invoice_date,
                    a.quote_num,
                    a.quote_date,
                    a.created_at,
                    d.name AS doctor,
                    COALESCE(a.print_service, s.name) AS service,
                    m.name AS mutual,
                    s.billable AS is_service_billable
                FROM appointments a
                ${joinPart}
            `;

            let conditionPart = "";
            const queryParams = [];

            const WHERE = query => query.includes('WHERE') ? ' AND' : ' WHERE';

            if (name) {
                conditionPart += `${WHERE(conditionPart)} (
                    p.first_name LIKE ?
                    OR p.last_name LIKE ?
                    OR REPLACE(p.phone, ' ', '') LIKE REPLACE(?, ' ', '')
                    OR REPLACE(p.phone2, ' ', '') LIKE REPLACE(?, ' ', '')
                )`;
                queryParams.push(`%${name}%`, `%${name}%`, `%${name}%`, `%${name}%`);
            }

            if (mutual) {
                if (mutual == "all") {
                    conditionPart += `${WHERE(conditionPart)} p.mutual_id IS NOT NULL`;
                }
                else if (mutual == "none") {
                    conditionPart += `${WHERE(conditionPart)} p.mutual_id IS NULL`;
                }
                else {
                    conditionPart += `${WHERE(conditionPart)} p.mutual_id = ?`;
                    queryParams.push(mutual);
                }
            }

            if (status) {
                conditionPart += `${WHERE(conditionPart)} a.status = ?`;
                queryParams.push(status);
            }

            if (service) {
                conditionPart += `${WHERE(conditionPart)} a.service_id = ?`;
                queryParams.push(service);
            }

            if (billed) {
                if (billed == "yes") {
                    conditionPart += `${WHERE(conditionPart)} a.invoice_num IS NOT NULL`;
                }
                else {
                    conditionPart += `${WHERE(conditionPart)} a.invoice_num IS NULL`;
                }
            }

            if (daterange?.to) {
                const { from, to } = daterange;
                conditionPart += `${WHERE(conditionPart)} EXISTS (SELECT 1 FROM payments WHERE appointment_id = a.id AND created_at BETWEEN ? AND ?)`;
                queryParams.push(from, to);
            }
            else if (daterange?.from) {
                conditionPart += `${WHERE(conditionPart)} EXISTS (SELECT 1 FROM payments WHERE appointment_id = a.id AND created_at >= ?)`;
                queryParams.push(daterange.from);
            }

            const [countQuery] = await db.query(`SELECT COUNT(*) as count FROM appointments a ${joinPart} ${conditionPart}`, queryParams);
            const totalCount = countQuery[0].count;

            conditionPart += ' ORDER BY a.date DESC';

            // Pagination
            const pageSize = 100;
            if (page) {
                const offset = (page - 1) * pageSize;
                conditionPart += ` LIMIT ${pageSize} OFFSET ${offset}`;
            }

            const [appointments] = await db.query(`
                ${appointmentsQuery}
                ${conditionPart}
            `, queryParams);

            if (appointments.length) {
                const [payments] = await db.query(
                    'SELECT *, created_at as date FROM payments WHERE appointment_id IN (?)',
                    [appointments.map(row => row.id)]
                );

                const paymentsMap = {};
                payments.forEach(payment => {
                    if (!paymentsMap[payment.appointment_id]) {
                        paymentsMap[payment.appointment_id] = [];
                    }
                    paymentsMap[payment.appointment_id].push(payment);
                });

                appointments.forEach(row => {
                    row.payments = paymentsMap[row.id] || [];
                })
            }

            let totalsQuery = `
                SELECT
                    IFNULL(SUM(pay.amount), 0) AS totalPayments,
                    COUNT(pay.id) AS countPayments
                FROM payments pay
                LEFT JOIN appointments a ON pay.appointment_id = a.id
                LEFT JOIN patients p ON a.patient_id = p.id
                WHERE a.status != 'cancelled'
            `

            if (daterange?.to) {
                const { from, to } = daterange;
                totalsQuery += ` AND pay.created_at BETWEEN ? AND ?`;
                queryParams.unshift(from, to);
            }
            else if (daterange?.from) {
                totalsQuery += ` AND pay.created_at >= ?`;
                queryParams.unshift(daterange.from);
            }
            const [totals] = await db.query(`${totalsQuery} ${conditionPart.replace('WHERE', 'AND')}`, queryParams);
            const [reste] = await db.query(`
                SELECT SUM(price - COALESCE(pay_total.total_paid, 0)) AS totalReste, COUNT(CASE WHEN (price - COALESCE(pay_total.total_paid, 0)) > 0 THEN 1 END) AS countReste
                FROM appointments a
                LEFT JOIN payments pay ON a.id = pay.appointment_id
                LEFT JOIN (
                    SELECT appointment_id, SUM(amount) AS total_paid
                    FROM payments
                    GROUP BY appointment_id
                ) pay_total ON a.id = pay_total.appointment_id
                WHERE a.status != 'cancelled'
            `);

            res.json({
                data: appointments,
                activePage: page ? Number(page) : 1,
                pagesNumber: Math.ceil(totalCount / pageSize),
                count: totalCount,
                totals: {
                    ...totals[0],
                    ...reste[0]
                }
            });

        } catch (err) {
            console.error('SQL Error:', err);
            res.status(500).json({
                error: 'Error fetching appointment details',
                details: err
            });
        }
    });

    app.get('/appointments/payments/all', async (req, res) => {
        try {
            const { daterange, name, mutual, status, service } = req.query;

            let query = `
                SELECT
                    pay.created_at as date,
                    CONCAT(p.last_name, ' ', p.first_name) AS patient_name,
                    a.service_id,
                    pay.amount
                FROM payments pay
                LEFT JOIN appointments a ON pay.appointment_id = a.id
                LEFT JOIN patients p ON a.patient_id = p.id
                WHERE a.status != 'cancelled'
            `

            const queryParams = [];

            const WHERE = query => query.includes('WHERE') ? ' AND' : ' WHERE';
            if (name) {
                query += `${WHERE(query)} (
                    p.first_name LIKE ?
                    OR p.last_name LIKE ?
                    OR REPLACE(p.phone, ' ', '') LIKE REPLACE(?, ' ', '')
                    OR REPLACE(p.phone2, ' ', '') LIKE REPLACE(?, ' ', '')
                )`;
                queryParams.push(`%${name}%`, `%${name}%`, `%${name}%`, `%${name}%`);
            }
            if (mutual) {
                if (mutual == "all") {
                    query += `${WHERE(query)} p.mutual_id IS NOT NULL`;
                }
                else {
                    query += `${WHERE(query)} p.mutual_id = ?`;
                    queryParams.push(mutual);
                }
            }
            if (status) {
                query += `${WHERE(query)} a.status = ?`;
                queryParams.push(status);
            }
            if (service) {
                query += `${WHERE(query)} a.service_id = ?`;
                queryParams.push(service);
            }
            if (daterange?.to) {
                const { from, to } = daterange;
                query += `${WHERE(query)} pay.created_at BETWEEN ? AND ?`;
                queryParams.push(from, to);
            }
            else if (daterange?.from) {
                query += `${WHERE(query)} pay.created_at >= ?`;
                queryParams.push(daterange?.from);
            }

            //query += ' ORDER BY pay.created_at DESC';
            const [rows] = await db.query(query, queryParams);
            res.json(rows);
        }
        catch (err) {
            console.error('SQL Error:', err);
            res.status(500).json({
                error: 'Error fetching appointment details',
                details: err
            });
        }
    })

    app.get('/appointments/:id/payments/:type', async (req, res) => {
        try {
            const { id, type } = req.params;
            if (!["quote", "invoice"].includes(type)) {
                return res.status(400).json({ error: "Type de données non valide" });
            }
            // Check if invoice number already exists for the appointment
            const [appointment] = await db.query(`SELECT ${type}_num FROM appointments WHERE id = ?`, [id]);
            let storedNum = appointment[0]?.[`${type}_num`];
            if (storedNum) {
                return res.json({
                    num: storedNum,
                    exists: true
                })
            }
            // Get the last invoice number from the settings table
            const prefix = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
            // check if the prefix is already exists
            const [existingPrefix] = await db.query(`SELECT COUNT(*) AS count FROM appointments WHERE ${type}_num LIKE ?`, [`${prefix}%`]);
            if (existingPrefix[0].count == 0) {
                return res.json({
                    num: `${prefix}01`,
                    exists: false
                })
            }
            const [settings] = await db.query(`SELECT MAX(last_${type}_num) AS last_${type}_num FROM settings`);
            const lastNum = settings[0]?.[`last_${type}_num`] + 1;
            return res.json({
                num: `${prefix}${String(lastNum).padStart(2, '0')}`,
                exists: false
            });
        }
        catch (err) {
            console.error('SQL Error:', err);
            res.status(500).json({
                error: 'Error fetching appointment details',
                details: err
            });
        }
    })

    app.put('/appointments/:id/payments/:type', async (req, res) => {
        const { id, type } = req.params;
        const { num, isChanged } = req.body;

        if (!["quote", "invoice"].includes(type)) {
            return res.status(400).json({ error: "Type de données non valide" });
        }

        if (!num) {
            return res.status(400).json({ error: "Numéro de facture manquant" });
        }

        let connection;
        try {
            // Check if the appointment exists
            const [appointment] = await db.query(`SELECT * FROM appointments WHERE id = ?`, [id]);
            if (appointment.length === 0) {
                return res.status(404).json({ error: "Rendez-vous non trouvé" });
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            // Update the appointment with the new invoice number
            await connection.query(`UPDATE appointments SET ${type}_num = ? WHERE id = ?`, [num, id]);

            if (!isChanged) {
                // Update the last invoice number in the settings table
                await connection.query(`UPDATE settings SET last_${type}_num = ?`, [num.slice(6)]);
            }

            await connection.commit();
            res.json({ message: `Numéro de ${type} mis à jour avec succès` });
        } catch (err) {
            if (connection) await connection.rollback();
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du numéro de facture', details: err });
        }
        finally {
            if (connection) connection.release();
        }
    })

    app.put('/appointments/:id/invoice', async (req, res) => {
        const { id } = req.params;
        const { service, invoice_date, quote_date } = req.body;

        try {
            // Check if the appointment exists
            const [appointment] = await db.query(`SELECT * FROM appointments WHERE id = ?`, [id]);
            if (appointment.length === 0) {
                return res.status(404).json({ error: "Rendez-vous non trouvé" });
            }

            if (service) {
                await db.query(`UPDATE appointments SET print_service = ? WHERE id = ?`, [service, id]);
            }

            if (invoice_date) {
                await db.query(`UPDATE appointments SET invoice_date = ? WHERE id = ?`, [invoice_date, id]);
            }

            if (quote_date) {
                await db.query(`UPDATE appointments SET quote_date = ? WHERE id = ?`, [quote_date, id]);
            }

            res.json({ message: `Facture mis à jour avec succès` });
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la mise à jour de la facture', details: err });
        }
    })

    // Ajouter un rendez-vous (avec ajout de patient si nécessaire)
    app.post('/appointments', async (req, res) => {
        let connection;
        try {
            let { patient_id, doctor_id, service_id, date, price, positif_molding, absent, payments, mutual_id } = req.body;
            const newStatus = price != 0 && !payments?.length ? "instance" : "active";

            if (!patient_id)
                return res.status(400).json({ error: "Le patient est obligatoire" });
            else if (!doctor_id)
                return res.status(400).json({ error: "Le médecin est obligatoire" });
            else if (!service_id)
                return res.status(400).json({ error: "Le service est obligatoire" });
            else if (!price)
                return res.status(400).json({ error: "Le prix est obligatoire" });
            else if (newStatus != "instance" && !date)
                return res.status(400).json({ error: "La date et l'heure sont obligatoires" });

            // Check if there is an appointment at the same date and time
            const [existing] = await db.query(`
                SELECT a.id FROM appointments a
                INNER JOIN status s ON s.appointment_id = a.id
                WHERE a.date = ? AND s.status != 'cancelled'
                `, [date]);
            if (existing.length > 0) {
                return res.status(400).json({ error: "Il y a déjà un rendez-vous à la même date et heure." });
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            // Ajouter le rendez-vous
            const [result] = await connection.query(
                "INSERT INTO appointments (patient_id, doctor_id, service_id, date, price, positif_molding, absent, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    patient_id,
                    doctor_id,
                    service_id || null,
                    price != 0 && !payments?.length ? null : date,
                    price || 0.00,
                    positif_molding || 0,
                    absent || 0,
                    newStatus,
                    req.user.id
                ]
            );

            // Insert payments
            if (payments && payments.length) {
                const paymentsQuery = "INSERT INTO payments (appointment_id, amount, is_tpe, created_by) VALUES ?";
                const paymentsValues = payments.map(payment => [result.insertId, payment.amount, payment.is_tpe, req.user.id]);
                await connection.query(paymentsQuery, [paymentsValues]);
            }

            // Insert status
            await connection.query("INSERT INTO status (appointment_id, status, created_by) VALUES (?, ?, ?)", [
                result.insertId,
                newStatus,
                req.user.id
            ]);

            // Update patient mutual if provided
            if (mutual_id) {
                await connection.query("UPDATE patients SET mutual_id = ? WHERE id = ?", [mutual_id, patient_id]);
            }

            await connection.commit();
            res.status(201).json({ message: "Rendez-vous ajouté", appointment_id: result.insertId });
            const printList = [];
            for (const payment of payments) {
                printList.push({
                    title: `Nouveau montant encaissé ${payment.is_tpe ? "(TPE)" : ""}`,
                    amount: payment.amount
                });
            }
            if (printList.length) {
                printReceipt({
                    rdvId: result.insertId,
                    userId: req.user.id,
                    printList,
                    connection
                })
            }
            io.emit("appointments", { action: "create", user: req.user.id });
        } catch (err) {
            if (connection) await connection.rollback();
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de l'ajout du rendez-vous", details: err.message });
        }
        finally {
            if (connection) connection.release();
        }
    });

    // Mettre à jour un rendez-vous
    app.put('/appointments/:id', async (req, res) => {
        let connection;
        try {
            const { id } = req.params;
            let { patient_id, doctor_id, service_id, date, price, positif_molding, absent, statusList, payments, mutual_id } = req.body;
            const lastStatus = [...statusList].pop();

            if (!id) {
                return res.status(400).json({ error: "L'ID du rendez-vous est requis." });
            }

            if (!patient_id)
                return res.status(400).json({ error: "Le patient est obligatoire" });
            else if (!doctor_id)
                return res.status(400).json({ error: "Le médecin est obligatoire" });
            else if (!service_id)
                return res.status(400).json({ error: "Le service est obligatoire" });
            else if (!price)
                return res.status(400).json({ error: "Le prix est obligatoire" });
            else if (lastStatus?.status != "instance" && !date)
                return res.status(400).json({ error: "La date et l'heure sont obligatoires" });


            // Check if the appointment exists
            const [existing] = await db.query("SELECT * FROM appointments WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Rendez-vous non trouvé" });
            }

            // Check if there is an appointment at the same date and time
            const [existingSameTime] = await db.query(`
                SELECT a.id
                FROM appointments a
                INNER JOIN status s ON s.appointment_id = a.id
                WHERE a.date = ?
                AND a.id != ?
                AND s.status != 'cancelled'
            `, [date, id]);
            if (existingSameTime.length > 0 && lastStatus?.status != "cancelled") {
                return res.status(400).json({ error: "Il y a déjà un rendez-vous à la même date et heure." });
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            // Update the appointment
            await connection.query(
                `UPDATE appointments
                SET patient_id = ?,
                    doctor_id = ?,
                    service_id = ?,
                    date = ?,
                    price = ?,
                    positif_molding = ?,
                    absent = ?,
                    status = ?,
                    updated_by = ?
                WHERE id = ?`,
                [
                    patient_id,
                    doctor_id,
                    service_id || null,
                    date,
                    price,
                    positif_molding || 0,
                    absent || 0,
                    lastStatus?.status || "active",
                    req.user.id,
                    id
                ]
            );

            const printList = [];
            // Update payments
            if (payments) {
                // Delete removed payments
                if (payments.length) {
                    const paymentIds = payments.filter(payment => payment.id).map(payment => payment.id);
                    if (paymentIds.length) {
                        // Get total to be deleted
                        const [totalToDelete] = await connection.query("SELECT SUM(amount) AS total FROM payments WHERE appointment_id = ? AND id NOT IN (?)", [id, paymentIds]);
                        await connection.query("DELETE FROM payments WHERE appointment_id = ? AND id NOT IN (?)", [id, paymentIds]);
                        if (totalToDelete[0].total > 0) {
                            printList.push({
                                title: "Suppression du montant",
                                amount: -totalToDelete[0].total
                            });
                        }
                    }
                }
                else {
                    const [totalToDelete] = await connection.query("SELECT SUM(amount) AS total FROM payments WHERE appointment_id = ?", [id]);
                    await connection.query("DELETE FROM payments WHERE appointment_id = ?", [id]);
                    if (totalToDelete[0].total > 0) {
                        printList.push({
                            title: "Suppression de tous les montants",
                            amount: -totalToDelete[0].total
                        });
                    }
                }

                for (const payment of payments) {
                    if (!payment.id) {
                        await connection.query("INSERT INTO payments (appointment_id, amount, is_tpe, created_by) VALUES (?, ?, ?, ?)", [id, payment.amount, payment.is_tpe, req.user.id]);
                        printList.push({
                            title: `Nouveau montant encaissé ${payment.is_tpe ? "(TPE)" : ""}`,
                            amount: payment.amount
                        });
                    }
                    else {
                        // update only if the amount is different
                        const [existingPayment] = await connection.query("SELECT * FROM payments WHERE id = ?", [payment.id]);
                        if (existingPayment.length === 0)
                            return res.status(404).json({ error: "Paiement non trouvé" });
                        // Check if the amount is different
                        if (existingPayment[0].amount != payment.amount || existingPayment[0].is_tpe != payment.is_tpe) {
                            await connection.query("UPDATE payments SET amount = ?, is_tpe = ?, updated_by = ? WHERE id = ?", [payment.amount, payment.is_tpe, req.user.id, payment.id]);

                            printList.push({
                                title: `Modification du montant (${existingPayment[0].amount}) ${payment.is_tpe ? "(TPE)" : ""}`,
                                amount: payment.amount
                            });
                        }
                    }
                }
            }

            // Update status
            if (statusList) {
                // Delete removed status
                if (statusList.length) {
                    const statusIds = statusList.map(status => status.id);
                    await connection.query("DELETE FROM status WHERE appointment_id = ? AND id NOT IN (?)", [id, statusIds]);
                }
                else {
                    await connection.query("DELETE FROM status WHERE appointment_id = ?", [id]);
                }

                for (const status of statusList) {
                    if (!status.id) {
                        await connection.query("INSERT INTO status (appointment_id, status, created_by) VALUES (?, ?, ?)", [id, status.status, req.user.id]);
                    }
                    else {
                        // update only if the status is different
                        const [existingStatus] = await connection.query("SELECT * FROM status WHERE id = ?", [status.id]);
                        if (existingStatus.length === 0)
                            return res.status(404).json({ error: "Statut non trouvé" });
                        // Check if the status is different
                        if (existingStatus[0].status != status.status)
                            await connection.query("UPDATE status SET status = ?, updated_by = ? WHERE id = ?", [status.status, req.user.id, status.id]);
                    }
                }
            }

            // Update patient mutual if provided
            if (mutual_id) {
                await connection.query("UPDATE patients SET mutual_id = ? WHERE id = ?", [mutual_id, patient_id]);
            }

            await connection.commit();
            res.json({ message: "Rendez-vous mis à jour avec succès." });
            if (printList.length) {
                printReceipt({
                    rdvId: id,
                    userId: req.user.id,
                    printList,
                    connection
                })
            }
            io.emit('appointments', { action: 'update', user: req.user.id });
        } catch (err) {
            if (connection) await connection.rollback();
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour du rendez-vous", details: err });
        }
        finally {
            if (connection) connection.release();
        }
    });

    app.put('/appointments/:id/workshop', async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (status === undefined) {
                return res.status(400).json({ error: "Le statut est obligatoire" });
            }

            await db.query("UPDATE appointments SET workshop_status = ?, updated_by = ? WHERE id = ?", [status, req.user.id, id]);

            res.json({ message: 'STatut atelier mis à jour' });
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du statut de l\'atelier', details: err.message });
        }
    });

    async function printReceipt({ userId, rdvId, printList, connection }) {
        try {
            const escpos = require("escpos");
            escpos.USB = require("escpos-usb");
            const printerDevice = new escpos.USB();
            const printer = new escpos.Printer(printerDevice);

            // Wrap printerDevice.open in a Promise
            await new Promise((resolve, reject) => {
                printerDevice.open(async (err) => {
                    if (err) {
                        console.error("Error opening the printer:", err);
                        return reject(err);
                    }

                    const receiptNumber = await getReceiptNumber(connection);
                    const formattedDate = new Date().toLocaleString('fr-FR');
                    const [user] = await db.query("SELECT username FROM users WHERE id = ?", [userId]);
                    const username = user[0]?.username;

                    // Do a query to get patient name, appointment price in one query
                    const [appointment] = await connection.query(
                        `
                        SELECT
                            CONCAT(p.last_name, ' ', p.first_name) AS patient_name,
                            a.service_id,
                            price,
                            (SELECT SUM(amount) FROM payments WHERE appointment_id = a.id) AS paid
                        FROM appointments a
                        JOIN patients p ON a.patient_id = p.id
                        WHERE a.id = ?
                        `,
                        [rdvId]
                    );
                    const patientName = appointment[0]?.patient_name;
                    const service = appointment[0]?.service_id;
                    const total = appointment[0]?.price;
                    const paid = appointment[0]?.paid || 0;
                    const reste = (total - paid).toFixed(2);

                    printer
                        .font("A").align('CT').style('b').size(1, 1).text(`Ticket N: ${receiptNumber}`)
                        .text("")
                        .size(0, 0)
                        .tableCustom([
                            { text: formattedDate, align: "RIGHT", style: 'normal' },
                        ])
                        .tableCustom([
                            { text: `Agent: ${username}`, style: 'B' }
                        ])
                        .tableCustom([
                            { text: '-'.repeat(42), style: 'normal' }
                        ])
                        .tableCustom([
                            { text: "Rendez-vous :", align: "LEFT", width: 0.5, style: 'normal' },
                            { text: rdvId, align: "RIGHT", width: 0.5, style: 'B' }
                        ])
                        .tableCustom([
                            { text: "Patient :", align: "LEFT", width: 0.5, style: 'normal', height: 1 },
                            { text: patientName, align: "RIGHT", width: 0.5, style: 'B' }
                        ])
                        .tableCustom([
                            { text: "Prestation :", align: "LEFT", width: 0.5, style: 'normal' },
                            { text: service, align: "RIGHT", width: 0.5, style: 'B' }
                        ])
                        .tableCustom([
                            { text: '-'.repeat(42), style: 'normal' }
                        ]);

                    printer
                        .encode('CP850');

                    printList.forEach(({ title, amount }) => {
                        amount = typeof amount === 'number' ? amount.toFixed(2) : amount;
                        printer
                            .text("")
                            .size(0, 0)
                            .align("CT")
                            .text(title);
                        printer.size(1, 1).align("CT").text(`${amount} DH`);
                    });

                    printer
                        .size(0, 0)
                        .align("CT")
                        .tableCustom([
                            { text: '-'.repeat(42), style: 'normal' }
                        ])
                        .tableCustom([
                            { text: "Prix", align: "LEFT", width: 0.33333333333, style: 'normal' },
                            { text: "Total payé", align: "CENTER", width: 0.33333333333, style: 'normal' },
                            { text: "Reste", align: "RIGHT", width: 0.33333333333, style: 'normal' }
                        ])
                        .tableCustom([
                            { text: `${total} DH`, align: "LEFT", width: 0.33333333333, style: 'B' },
                            { text: `${paid} DH`, align: "CENTER", width: 0.33333333333, style: 'B' },
                            { text: `${reste} DH`, align: "RIGHT", width: 0.33333333333, style: 'B' }
                        ]);

                    printer
                        .text("")
                        .text("")
                        .text("")
                        .cut()
                        .close(resolve); // Resolves the promise when done
                });
            });
        }
        catch (error) {
            console.error("Error printing receipt:", error);
        }
    }

    // Mettre à jour l'absence d'un rendez-vous
    app.put('/appointments/:id/absent', async (req, res) => {
        try {
            const { id } = req.params;
            const { absent } = req.body;

            if (absent === undefined) {
                return res.status(400).json({ error: "L'absence est obligatoire" });
            }

            await db.query("UPDATE appointments SET absent = ?, updated_by = ? WHERE id = ?", [absent, req.user.id, id]);
            res.json({ message: "Absence mise à jour avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour de l'absence", details: err.message });
        }
    });

    // Ajouter une note
    // app.post('/appointments/note', async (req, res) => {
    //     try {
    //         const { date, note } = req.body;

    //         res.json({ message: "Note ajoutée avec succès." });
    //     } catch (err) {
    //         console.error("Erreur SQL:", err);
    //         res.status(500).json({ error: "Erreur lors de l'ajout de la note", details: err });
    //     }
    // })

    // Supprimer un rendez-vous
    app.delete('/appointments/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.query('DELETE FROM appointments WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Rendez-vous non trouvé' });
            }
            res.json({ message: 'Rendez-vous supprimé' });
        } catch (err) {
            console.error('Erreur SQL:', err);
            res.status(500).json({ error: 'Erreur lors de la suppression du rendez-vous', details: err.message });
        }
    });

    /* ─────────────────────────────────────────── */
    /*                  DOCTORS                    */
    /* ─────────────────────────────────────────── */

    app.get('/doctors', async (req, res) => {
        try {
            const query = `
                SELECT d.*,
                        s.name AS speciality,
                       COUNT(a.id) AS appointments_count
                FROM doctors d
                LEFT JOIN specialities s ON d.speciality_id = s.id
                LEFT JOIN appointments a ON d.id = a.doctor_id
                GROUP BY d.id, d.name
                ORDER BY appointments_count DESC
            `;

            const [rows] = await db.query(query);
            res.json(rows);
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la récupération des médecins", details: err.message });
        }
    });

    app.post('/doctors', async (req, res) => {
        try {
            const { name, speciality_id, address, phone } = req.body;

            if (!name) {
                return res.status(400).json({ error: "Le nom du médecin est obligatoire." });
            }

            const [result] = await db.query("INSERT INTO doctors (name, speciality_id, address, phone) VALUES (?, ?, ?, ?)", [
                name,
                speciality_id || null,
                address || null,
                phone || null
            ]);

            res.status(201).json({ message: "Médecin ajouté avec succès.", doctor_id: result.insertId });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de l'ajout du médecin", details: err.message });
        }
    });

    app.put('/doctors/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, speciality_id, address, phone } = req.body;

            if (!name) {
                return res.status(400).json({ error: "Le nom du médecin est obligatoire." });
            }

            const [existing] = await db.query("SELECT id FROM doctors WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Médecin non trouvé." });
            }

            await db.query("UPDATE doctors SET name = ?, speciality_id = ?, address = ?, phone = ? WHERE id = ?", [
                name,
                speciality_id || null,
                address || null,
                phone || null,
                id
            ]);

            res.json({ message: "Médecin mis à jour avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour du médecin", details: err.message });
        }
    });

    app.delete('/doctors/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Vérifier si le médecin existe
            const [existing] = await db.query("SELECT id FROM doctors WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Médecin non trouvé." });
            }

            // Vérifier s'il a des rendez-vous
            const [appointments] = await db.query("SELECT id FROM appointments WHERE doctor_id = ?", [id]);
            if (appointments.length > 0) {
                return res.status(400).json({ error: "Impossible de supprimer ce médecin, il a des rendez-vous associés." });
            }

            await db.query("DELETE FROM doctors WHERE id = ?", [id]);

            res.json({ message: "Médecin supprimé avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la suppression du médecin", details: err.message });
        }
    });

    /* ─────────────────────────────────────────── */
    /*                SPECIALITIES                 */
    /* ─────────────────────────────────────────── */

    app.get('/specialities', async (req, res) => {
        try {
            const query = `
                SELECT s.*,
                       COUNT(d.id) AS doctors_count
                FROM specialities s
                LEFT JOIN doctors d ON s.id = d.speciality_id
                GROUP BY s.id, s.name
                ORDER BY doctors_count DESC
            `;

            const [rows] = await db.query(query);
            res.json(rows);
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la récupération des spécialités", details: err.message });
        }
    })

    app.post('/specialities', async (req, res) => {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: "Le nom de la spécialité est obligatoire." });
            }

            const [result] = await db.query("INSERT INTO specialities (name) VALUES (?)", [name]);

            res.status(201).json({ message: "Spécialité ajoutée avec succès.", speciality_id: result.insertId });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de l'ajout de la spécialité", details: err.message });
        }
    })

    app.put('/specialities/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: "Le nom de la spécialité est obligatoire." });
            }

            const [existing] = await db.query("SELECT id FROM specialities WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Spécialité non trouvée." });
            }

            await db.query("UPDATE specialities SET name = ? WHERE id = ?", [name, id]);

            res.json({ message: "Spécialité mise à jour avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour de la spécialité", details: err.message });
        }
    })

    app.delete('/specialities/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Vérifier si la spécialité existe
            const [existing] = await db.query("SELECT id FROM specialities WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Spécialité non trouvée." });
            }

            // Vérifier s'il y a des médecins associés
            const [doctors] = await db.query("SELECT id FROM doctors WHERE speciality_id = ?", [id]);
            if (doctors.length > 0) {
                return res.status(400).json({ error: "Impossible de supprimer cette spécialité, elle a des médecins associés." });
            }

            await db.query("DELETE FROM specialities WHERE id = ?", [id]);

            res.json({ message: "Spécialité supprimée avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la suppression de la spécialité", details: err.message });
        }
    })

    /* ─────────────────────────────────────────── */
    /*                  SERVICES                   */
    /* ─────────────────────────────────────────── */

    app.get('/services', async (req, res) => {
        try {
            const query = `
                SELECT s.*,
                       COUNT(a.id) AS appointments_count
                FROM services s
                LEFT JOIN appointments a ON s.id = a.service_id
                GROUP BY s.id, s.name
                ORDER BY appointments_count DESC
            `;

            const [rows] = await db.query(query);
            res.json(rows);
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la récupération des services", details: err.message });
        }
    });

    app.post('/services', async (req, res) => {
        try {
            const { name, billable, is_default } = req.body;

            if (!name) {
                return res.status(400).json({ error: "Le nom du service est obligatoire." });
            }

            const [result] = await db.query("INSERT INTO services (name, billable, is_default) VALUES (?, ?, ?)", [
                name,
                billable || 0,
                is_default || 0
            ]);

            res.status(201).json({ message: "Service ajouté avec succès.", service_id: result.insertId });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de l'ajout du service", details: err.message });
        }
    });

    app.put('/services/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, billable, is_default } = req.body;

            if (!name) {
                return res.status(400).json({ error: "Le nom du service est obligatoire." });
            }

            const [existing] = await db.query("SELECT id FROM services WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Service non trouvé." });
            }

            await db.query("UPDATE services SET name = ?, billable = ?, is_default = ? WHERE id = ?", [
                name,
                billable,
                is_default,
                id
            ]);

            res.json({ message: "Service mis à jour avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour du service", details: err.message });
        }
    });

    app.delete('/services/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Vérifier si le service existe
            const [existing] = await db.query("SELECT id FROM services WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Service non trouvé." });
            }

            // Vérifier s'il a des rendez-vous
            const [appointments] = await db.query("SELECT id FROM appointments WHERE service_id = ?", [id]);
            if (appointments.length > 0) {
                return res.status(400).json({ error: "Impossible de supprimer ce service, il a des rendez-vous associés." });
            }

            await db.query("DELETE FROM services WHERE id = ?", [id]);

            res.json({ message: "Service supprimé avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la suppression du service", details: err.message });
        }
    });

    /* ─────────────────────────────────────────── */
    /*                  MUTUALS                    */
    /* ─────────────────────────────────────────── */

    app.get('/mutuals', async (req, res) => {
        try {
            const query = `
                SELECT m.id, m.name,
                       COUNT(p.id) AS patients_count
                FROM mutuals m
                LEFT JOIN patients p ON m.id = p.mutual_id
                GROUP BY m.id, m.name
                ORDER BY m.order
            `;

            const [rows] = await db.query(query);
            res.json(rows);
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la récupération des mutuelles", details: err.message });
        }
    });

    app.post('/mutuals', async (req, res) => {
        try {
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: "Le nom de la mutuelle est obligatoire." });
            }

            const [result] = await db.query("INSERT INTO mutuals (name) VALUES (?)", [name]);

            res.status(201).json({ message: "Mutuelle ajouté avec succès.", doctor_id: result.insertId });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de l'ajout de la mutuelle", details: err.message });
        }
    });

    app.put('/mutuals/:id(\\d+)', async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: "Le nom de la mutuelle est obligatoire." });
            }

            const [existing] = await db.query("SELECT id FROM mutuals WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Mutuelle non trouvé." });
            }

            await db.query("UPDATE mutuals SET name = ? WHERE id = ?", [name, id]);

            res.json({ message: "Mutuelle mis à jour avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour de la mutuelle", details: err.message });
        }
    });

    app.put('/mutuals/reorder', async (req, res) => {
        let connection;
        try {
            const { mutuals } = req.body;

            if (!Array.isArray(mutuals) || mutuals.length === 0) {
                return res.status(400).json({ error: "La liste des mutuelles est obligatoire." });
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            const promises = mutuals.map((id, index) => {
                return connection.query("UPDATE mutuals SET `order` = ? WHERE id = ?", [index, id]);
            });

            await Promise.all(promises);

            await connection.commit();
            res.json({ message: "Mutuelles réordonnées avec succès." });
        }
        catch (err) {
            if (connection) await connection.rollback();
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors du réordonnancement des mutuelles", details: err.message });
        }
        finally {
            if (connection) connection.release();
        }
    });

    app.delete('/mutuals/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Vérifier si la mutuelle existe
            const [existing] = await db.query("SELECT id FROM mutuals WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Mutuelle non trouvé." });
            }

            // Vérifier s'il a des patients
            const [patients] = await db.query("SELECT id FROM patients WHERE mutual_id = ?", [id]);
            if (patients.length > 0) {
                return res.status(400).json({ error: "Impossible de supprimer cette mutuelle, elle a des patients associés." });
            }

            await db.query("DELETE FROM mutuals WHERE id = ?", [id]);

            res.json({ message: "Mutuelle supprimée avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la suppression de la mutuelle", details: err.message });
        }
    });

    /* ─────────────────────────────────────────── */
    /*               PRICES                  */
    /* ─────────────────────────────────────────── */

    app.get('/prices', async (req, res) => {
        try {
            const query = `
                SELECT p.*,
                       COUNT(a.id) AS appointments_count
                FROM prices p
                LEFT JOIN appointments a ON p.price = a.price
                GROUP BY p.id
                ORDER BY p.id DESC
            `;

            const [rows] = await db.query(query);
            res.json(rows);
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la récupération des prix", details: err.message });
        }
    });

    app.post('/prices', async (req, res) => {
        try {
            const { price, is_default } = req.body;

            if (!price) {
                return res.status(400).json({ error: "Le prix est obligatoire." });
            }

            const [result] = await db.query("INSERT INTO prices (price, is_default) VALUES (?, ?)", [price, is_default || 0]);

            res.status(201).json({ message: "Prix ajouté avec succès.", price_id: result.insertId });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de l'ajout du prix", details: err.message });
        }
    });

    app.put('/prices/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { price, is_default } = req.body;

            if (!price) {
                return res.status(400).json({ error: "Le prix est obligatoire." });
            }

            await db.query("UPDATE prices SET price = ?, is_default = ? WHERE id = ?", [price, is_default, id]);

            res.json({ message: "Prix mis à jour avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour du prix", details: err.message });
        }
    });

    app.delete('/prices/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Vérifier si le prix existe
            const [existing] = await db.query("SELECT id FROM prices WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Prix non trouvé." });
            }

            await db.query("DELETE FROM prices WHERE id = ?", [id]);

            res.json({ message: "Prix supprimé avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la suppression du prix", details: err.message });
        }
    })

    /* ─────────────────────────────────────────── */
    /*                    NOTES                    */
    /* ─────────────────────────────────────────── */

    app.get('/notes', async (req, res) => {
        try {
            const { from = null, to = null } = req.query;

            let query = `
                SELECT * FROM notes
                WHERE date BETWEEN ? AND ?
            `;

            let toDateInclusive = new Date(to);
            toDateInclusive.setDate(toDateInclusive.getDate() + 1);
            toDateInclusive = toDateInclusive.toISOString().split('T')[0];

            const queryParams = [from, toDateInclusive];
            const [rows] = await db.query(query, queryParams);
            res.json(rows);
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la récupération des notes", details: err.message });
        }
    });

    app.post('/notes', async (req, res) => {
        try {
            const { title, description, color, date, done } = req.body;

            if (!title) {
                return res.status(400).json({ error: "Le titre de la note est obligatoire." });
            }
            if (!date) {
                return res.status(400).json({ error: "La date de la note est obligatoire." });
            }

            const [result] = await db.query("INSERT INTO notes (title, description, color, date, done, created_by) VALUES (?, ?, ?, ?, ?, ?)", [
                title,
                description || null,
                color || null,
                date,
                done || 0,
                req.user.id
            ]);

            res.status(201).json({ message: "Note ajoutée avec succès.", note_id: result.insertId });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de l'ajout de la note", details: err.message });
        }
    });

    app.put('/notes/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, color, date, done } = req.body;

            if (!title) {
                return res.status(400).json({ error: "Le titre de la note est obligatoire." });
            }
            if (!date) {
                return res.status(400).json({ error: "La date de la note est obligatoire." });
            }

            const [existing] = await db.query("SELECT id FROM notes WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Note non trouvée." });
            }

            await db.query("UPDATE notes SET title = ?, description = ?, color = ?, date = ?, done = ?, updated_by = ? WHERE id = ?", [
                title,
                description || null,
                color || null,
                date,
                done || 0,
                req.user.id,
                id
            ]);

            res.json({ message: "Note mise à jour avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour de la note", details: err.message });
        }
    });

    app.put('/notes/:id/done', async (req, res) => {
        try {
            const { id } = req.params;
            const { done } = req.body;

            if (done === undefined) {
                return res.status(400).json({ error: "Le statut de la note est obligatoire." });
            }

            await db.query("UPDATE notes SET done = ?, updated_by = ? WHERE id = ?", [done, req.user.id, id]);

            res.json({ message: "Statut de la note mis à jour avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour du statut de la note", details: err.message });
        }
    });

    app.delete('/notes/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Vérifier si la note existe
            const [existing] = await db.query("SELECT id FROM notes WHERE id = ?", [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: "Note non trouvée." });
            }

            await db.query("DELETE FROM notes WHERE id = ?", [id]);

            res.json({ message: "Note supprimée avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la suppression de la note", details: err.message });
        }
    });

    /* ─────────────────────────────────────────── */
    /*                  SETTINGS                   */
    /* ─────────────────────────────────────────── */

    app.get('/settings', async (req, res) => {
        try {
            const [rows] = await db.query("SELECT * FROM settings");
            res.json(rows[0] || {});
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la récupération des paramètres", details: err.message });
        }
    });

    app.put('/settings', async (req, res) => {
        try {
            const { email, phone, address_header, address_footer, patente, rc, cnss, ice, if: ifValue } = req.body;

            if (!email || !phone || !address_header || !address_footer || !patente || !rc || !cnss || !ice || !ifValue) {
                return res.status(400).json({ error: "Tous les champs sont obligatoires." });
            }

            const query = `
                UPDATE settings
                SET email = ?, phone = ?, address_header = ?, address_footer = ?, patente = ?, rc = ?, cnss = ?, ice = ?, \`if\` = ?
            `;

            await db.query(query, [email, phone, address_header, address_footer, patente, rc, cnss, ice, ifValue]);

            res.json({ message: "Paramètres mis à jour avec succès." });
        } catch (err) {
            console.error("Erreur SQL:", err);
            res.status(500).json({ error: "Erreur lors de la mise à jour des paramètres", details: err.message });
        }
    });

    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${PORT}`);
        //const bonjour = new Bonjour();
        //bonjour.publish({ name: 'PodoPro', type: 'podopro', port: PORT });
    });

    async function getReceiptNumber(connection) {
        try {
            const [settings] = await connection.query("SELECT MAX(last_receipt_num) AS last_receipt_num FROM settings");
            const receiptNum = settings[0]?.last_receipt_num + 1;
            await connection.query("UPDATE settings SET last_receipt_num = ?", [receiptNum]);
            return receiptNum;
        }
        catch {
            return null;
        }
    }
}

startLocalServer();
//export default startLocalServer;
