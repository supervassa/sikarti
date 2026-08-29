import React from "react";
import { Link } from "react-router-dom";
import { CONTACT_INFO } from "../../config/contactInfo";

const Footer = () => {
  const { addressLines, googleMapsUrl } = CONTACT_INFO;

  return (
    <footer className="bg-[#0b1f3d] text-white py-12 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">PKBM KARTINI</h2>
          <p className="text-sm text-gray-300 max-w-md">
            Membangun generasi cerdas dan mandiri melalui pendidikan non-formal
            yang berkualitas.
          </p>
        </div>
        <div className="md:text-right">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Alamat
          </h3>
          <address className="not-italic text-sm text-gray-300 leading-relaxed">
            {addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <div className="mt-3 flex gap-4 md:justify-end text-sm">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 font-medium"
            >
              Google Maps
            </a>
            <Link
              to="/kontak"
              className="text-red-400 hover:text-red-300 font-medium"
            >
              Halaman Kontak
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
