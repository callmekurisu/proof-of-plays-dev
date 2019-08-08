import axios from 'axios';
import { environment } from './Environment';

const PopClient = axios.create({ 
baseURL:`${environment.server}`
});

export default PopClient;