import axios from 'axios';
import { environment } from './Environment';

const PayClient = axios.create({
  baseURL:`${environment.paymentServer}`
});

export default PayClient;