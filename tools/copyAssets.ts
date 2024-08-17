import * as shell from 'shelljs';
/**
 * This script copies the `src/emails` directory to the `build/src/emails` directory.
 *
 * This is necessary because the `nodemailer` package requires all email templates
 * to be in a specific relative path to the `app.js` file.
 *
 * The `shell.cp` function is used to copy the `src/emails` directory to the `build/src/emails` directory.
 *
 * The first argument to `shell.cp` is the source directory, `src/emails`.
 *
 * The second argument to `shell.cp` is the destination directory, `build/src/emails`.
 *
 * The `-R` option tells `shell.cp` to copy the directory recursively.
 *
 * If the copy operation is successful, the script will exit with a `0` status code.
 *
 * If the copy operation fails, the script will exit with a non-zero status code.
 */

shell.cp('-R', 'src/emails', 'build/src/');
