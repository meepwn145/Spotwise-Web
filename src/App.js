import Login from "./components/Login";
import Create from "./components/Create"
import Dashboard from "./components/Dashboard"
import OperatorDashboard from "./Operator/OperatorDashboard";
import ViewSpace from "./Operator/ViewSpace"
import AgentRegistration from "./components/AgentRegistration"
import Tracks from "./components/Tracks";
import Feedback from "./components/Feedback"
import Profiles from "./components/Profiles"
import ForgetPassword from "./components/ForgetPassword"
import OperatorProfile from "./Operator/OperatorProfile"
import AgentSchedule from "./components/AgentSchedule"
import TicketInfo from "./components/TicketInfo"
import UserProvider from "./UserProvider";
import AdminPage from "./admin/AdminPage";
import FetchEstablishments from "./admin/FetchEstablishments";
import FetchParkingUsers from "./admin/FetchParkingUser";
import FetchAgents from "./admin/FetchAgents";
import EmailDetailPage from "./admin/EmailDetailPage";
import Reservation from "./Operator/Reservation";
import DashboardOp from "./Operator/DashboardOp";
import AddVehicleForm from "./Operator/AddVehicleForm";
import Home from "./Operator/Home"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
function App() {
  return (
    <div className="App">
      <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="Create" element={<Create />} />
          <Route path="AdminPage" element={<AdminPage />} />
          <Route path="Dashboard" element={<Dashboard />} />
          <Route path="OperatorDashboard" element={<OperatorDashboard />} />
          <Route path="ViewSpace" element={<ViewSpace/>} />
          <Route path="AgentRegistration" element={<AgentRegistration/>} />
          <Route path="Tracks" element={<Tracks/>} />
          <Route path="Feedback" element={<Feedback/>} />
          <Route path="Profiles" element={<Profiles/>} />
          <Route path="forget" element={<ForgetPassword/>} />
          <Route path="OperatorProfile" element={<OperatorProfile/>} />
          <Route path="AgentSchedule" element={<AgentSchedule/>} />
          <Route path="TicketInfo" element={<TicketInfo/>} />
          <Route path="FetchEstablishments" element={<FetchEstablishments/>} />
          <Route path="FetchParkingUsers" element={<FetchParkingUsers/>} />
          <Route path="FetchAgents" element={<FetchAgents/>} />
          <Route path="email/:email" element={<EmailDetailPage />} />
          <Route path="Reservation" element={<Reservation/>} />
          <Route path="DashboardOp" element={<DashboardOp/>} />
          <Route path="AddVehicleForm" element={<AddVehicleForm/>} />
          <Route path="Home" element={<Home/>} />
        </Routes>
      </Router>
      </UserProvider>
    </div>
  );
}

export default App;