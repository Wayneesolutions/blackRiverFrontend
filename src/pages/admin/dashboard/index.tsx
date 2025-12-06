import DispatchIcon from "../../../assets/images/delivery_truck_speed.png"
import GPSIcon from "../../../assets/images/share_location.png"
import DriverIcon from "../../../assets/images/car.png"
import MaintenanceIcon from "../../../assets/images/inactive_order.png"
import ComplianceIcon from "../../../assets/images/checkmark.png"
import BillingIcon from "../../../assets/images/punch_clock.png"
import { useNavigate } from 'react-router-dom';

const features = [
    {
        id: "dispatch",
        title: "Dispatch & Load Management",
        description: "Efficiently plan and assign loads to drivers while optimizing routes for streamlined delivery operations.",
        icon: DispatchIcon,
        route: "/admin/dispatch",
    },
    {
        id: "gps",
        title: "GPS Tracking and Vehicle Telematics",
        description: "Real-time fleet tracking with vehicle performance monitoring and driver behavior analytics.",
        icon: GPSIcon,
        route: "/admin/gpsvehicle",
    },
    {
        id: "driver",
        title: "Human Resources",
        description: "Simplify scheduling, communication, and performance monitoring to keep your driver team organized.",
        icon: DriverIcon,
        route: "/admin/Management",
    },
    {
        id: "maintenance",
        title: "Fleet Maintenance",
        description: "Schedule and track vehicle maintenance to keep your fleet running smoothly with minimal downtime.",
        icon: MaintenanceIcon,
        route: "/admin/fleetmaintenance",
    },
    {
        id: "compliance",
        title: "Compliance & Safety Management",
        description: "Automate compliance with industry regulations including ELD requirements, fuel tax reporting, and vehicle inspections.",
        icon: ComplianceIcon,
        route: "/admin/compliance",
    },
    {
        id: "billing",
        title: "Accounts",
        description: "Integrated business functions for managing human resources, driver payroll, and service billing.",
        icon: BillingIcon,
        route: "/admin/accounts",
    },
    {
        id: "health and safety",
        title: "Health and Safety",
        description: "Integrated module for managing health & safety alongside human resources, driver payroll, and service billing — including compliance, incident reporting, training records, and billing workflows.",
        icon: BillingIcon,
        route: "/admin/healthandsafety",
    }
];

const Index = () => {
    const navigate = useNavigate();

    const handleFeatureClick = (route: string) => {
        navigate(route);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-18">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group relative bg-white rounded-2xl px-4 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                            style={{
                                background:
                                    "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
                            }}
                            onClick={() => handleFeatureClick(feature.route)}
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
                                {feature.title}
                            </h3>

                            {/* Icon Container */}
                            <div className="mb-6 flex justify-center">
                                <img
                                    src={feature.icon}
                                    alt={feature.title}
                                    className="w-12 h-12 object-contain"
                                />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col h-full">
                                <p className="text-gray-700 text-xs leading-relaxed flex-grow">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Subtle accent border */}
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-200 group-hover:ring-blue-300 transition-all duration-300"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Index;
