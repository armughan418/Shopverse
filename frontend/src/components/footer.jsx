import React from "react";
import { useLanguage } from "../utils/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  return (
    <>
      <footer className="bg-orange-500 text-white py-8 mt-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold">Bawa Harbal</span>.{" "}
            {t("allRightsReserved")}
          </p>
          <div className="flex justify-center mt-3 gap-4 sm:gap-6 text-sm flex-wrap">
            <a
              href="#"
              className="hover:text-gray-100 transition-colors duration-200"
            >
              {t("privacyPolicy")}
            </a>
            <a
              href="#"
              className="hover:text-gray-100 transition-colors duration-200"
            >
              {t("termsOfService")}
            </a>
            <a
              href="#"
              className="hover:text-gray-100 transition-colors duration-200"
            >
              {t("contactUs")}
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
