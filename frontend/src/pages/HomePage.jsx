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
import ScrollEnhancements from '../components/ScrollEnhancements';

export default function HomePage() {
  return (
    <>
      <ScrollEnhancements />
      <Header />
      <main className="overflow-hidden">
        <Hero />
        
        <div className="scroll-reveal">
          <About />
        </div>

        <div className="scroll-reveal">
          <Organizations />
        </div>

        <div className="scroll-reveal">
          <News />
        </div>

        <div className="scroll-reveal">
          <Videos />
        </div>

        <div className="scroll-reveal">
          <PopularServices />
        </div>

        <div className="scroll-reveal">
          <GovernmentServices />
        </div>

        <div className="scroll-reveal">
          <Address />
        </div>

        <div className="scroll-reveal">
          <Contact />
        </div>
      </main>
      <Footer />
    </>
  );
}
