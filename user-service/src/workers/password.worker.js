import bcrypt from 'bcryptjs';

export const hash = (password) => bcrypt.hashSync(password, 10);

export const compare = ({ password, hashed }) => bcrypt.compareSync(password, hashed);
