const {exec} = require('child_process');

// Set the mysql user
const mysql_user = 'root';
// Set the mysql password
process.env.MYSQL_PWD = 'root';
// Set backups directory (make sure it exists)
const path_to_backup_directory = "/Users/User/Downloads/databases/";
//Set false no need zipped files
const need_to_zip = true;
//Set false if need to save archived and unarchived files
const need_to_delete_unarchived = true;

getAllDatabases = () => {
    return new Promise((resolve, reject) => {
        const command = `/Applications/MAMP/Library/bin/mysql -u ${mysql_user} -e "show databases;"`;

        exec(command, {env: process.env}, (error, stdout, stderr) => {
            if (error) {
                reject(error.message);
                return;
            }

            if (stderr) {
                reject(error.message);
                return;
            }
            resolve(stdout);
        });
    })
}

makeZip = (db_name) => {
    return new Promise((resolve, reject) => {
        const zip_command = `zip ${path_to_backup_directory}${db_name}.sql.zip ${path_to_backup_directory}${db_name}.sql`;

        exec(zip_command, {env: process.env}, (error, stdout, stderr) => {
            if (error) {
                reject({db_name, error: error.message});
                return;
            }
            if (stderr) {
                reject({db_name, stderr});
                return;
            }
            resolve(db_name);
        });
    })
}

makeBackupForDb = (db_name) => {
    return new Promise((resolve, reject) => {
        const command = `/Applications/MAMP/Library/bin/mysqldump -u ${mysql_user} ${db_name} > ${path_to_backup_directory}${db_name}.sql`;

        exec(command, {env: process.env}, (error, stdout, stderr) => {
            if (error) {
                reject({db_name, error: error.message});
                return;
            }

            if (stderr) {
                reject({db_name, stderr});
                return;
            }

            resolve(db_name);
        });
    })
}

deleteUnarchived = (db_name) => {
    return new Promise((resolve, reject) => {
        const command = `rm ${path_to_backup_directory}${db_name}.sql`;

        exec(command, {env: process.env}, (error, stdout, stderr) => {
            if (error) {
                reject({db_name, error: error.message});
                return;
            }

            if (stderr) {
                reject({db_name, stderr});
                return;
            }

            resolve(db_name);
        });
    })
}

const loop = async (databases) => {
    const errors = [];
    const success = [];
    for (const db_name of databases) {
        if (db_name !== "Database" && db_name !== "information_schema") {
            try {
                const backup_maded = await makeBackupForDb(db_name);

                if (backup_maded && !need_to_zip) {
                    success.push(db_name);
                    console.log('success:', db_name)
                    continue;
                }

                const zipped_result = await makeZip(db_name);

                if (zipped_result && !need_to_delete_unarchived) {
                    success.push(db_name);
                    console.log('success:', db_name);
                    continue;
                }

                await deleteUnarchived(db_name);

                success.push(db_name);
                console.log('success:', db_name)

            } catch (e) {
                errors.push(e);
                console.log('error:', e.db_name)
            }
        }
    }

    return {errors, success}
}


(async () => {
    const db_list_string = await getAllDatabases();
    const databases_array = db_list_string.split('\n').map(line => line.trim());
    const {errors, success} = await loop(databases_array);
    console.log("SUCCESS:");
    console.table(success);
    console.log("ERRORS:");
    errors.forEach((err) => {
        console.error(err);
    })
})();

