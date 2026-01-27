import { Header, Footer } from '../components/layout';
import { SignupForm } from '../components/auth';

function Signup() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <div className="flex-1 flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md">
                    <div className="card">
                        <SignupForm />
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Signup;
