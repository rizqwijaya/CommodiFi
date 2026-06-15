import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="card mx-auto max-w-md text-center">
      <h2 className="font-serif text-3xl font-bold">404</h2>
      <p className="mt-2 text-sm text-cream/60">This page does not exist.</p>
      <Link to="/" className="btn-outline mt-6 inline-flex">
        Back home
      </Link>
    </div>
  );
}
