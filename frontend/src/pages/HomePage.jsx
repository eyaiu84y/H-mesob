import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Organizations from '../components/Organizations';
import News from '../components/News';
import Videos from '../components/Videos';
import PopularServices from '../components/PopularServices';
import GovernmentServices from '../components/GovernmentServices';
import Address from '../components/Address';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Organizations />
        <News />
        <Videos />
        <PopularServices />
        <GovernmentServices />
        <Address />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
