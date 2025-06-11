import { Footer as FooterType } from "@/types/blocks/footer";
import Icon from "@/components/icon";
import Script from "next/script";
import { useTranslations } from "next-intl";

export default function Footer({ footer }: { footer: FooterType }) {
  const t = useTranslations('stats');
  
  if (footer.disabled) {
    return null;
  }

  return (
    <section id={footer.name} className="py-16">
      <div className="max-w-7xl mx-auto px-8">
        <footer>
          <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
              {footer.brand && (
                <div>
                  <div className="flex items-center justify-center gap-2 lg:justify-start">
                    {footer.brand.logo && (
                      <img
                        src={footer.brand.logo.src}
                        alt={footer.brand.logo.alt || footer.brand.title}
                        className="h-11"
                      />
                    )}
                    {footer.brand.title && (
                      <p className="text-3xl font-semibold">
                        {footer.brand.title}
                      </p>
                    )}
                  </div>
                  {footer.brand.description && (
                    <p className="mt-6 text-md text-muted-foreground">
                      {footer.brand.description}
                    </p>
                  )}
                </div>
              )}
            
            </div>
            <div className="grid grid-cols-3 gap-6 lg:gap-20">
              {footer.nav?.items?.map((item, i) => (
                <div key={i}>
                  <p className="mb-6 font-bold">{item.title}</p>
                  <ul className="space-y-4 text-sm text-muted-foreground">
                    {item.children?.map((iitem, ii) => (
                      <li key={ii} className="font-medium hover:text-primary">
                        <a href={iitem.url} target={iitem.target}>
                          {iitem.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-4 border-t pt-8 text-center text-sm font-medium text-muted-foreground lg:flex-row lg:items-center lg:text-left">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
              {footer.copyright && (
                <p>
                  {footer.copyright}
                  {process.env.NEXT_PUBLIC_SHOW_POWERED_BY === "false" ? null : (
                    <>
                      <span className="text-muted-foreground"> | </span>
                      <a href="mailto:eric.wuyu1352@gmail.com" >
                        eric.wuyu1352@gmail.com
                      </a>  
                      <span className="text-muted-foreground"> |</span>
                    <a
                      href="https://shipany.ai"
                      target="_blank"
                      className="px-2 text-primary"
                    >
                      build with ShipAny
                    </a>
                    </>
                  )}
                </p>
              )}
              
              {/* 不蒜子访问统计 */}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground/80 lg:flex-row lg:gap-4">
                <span id="busuanzi_container_site_pv">
                  {t('totalViews')} <span id="busuanzi_value_site_pv"></span> {t('viewsUnit')}
                </span>
                <span id="busuanzi_container_site_uv">
                  {t('totalVisitors')} <span id="busuanzi_value_site_uv"></span> {t('visitorsUnit')}
                </span>
              </div>
            </div>

            {footer.agreement && (
              <ul className="flex justify-center gap-4 lg:justify-start">
                {footer.agreement.items?.map((item, i) => (
                  <li key={i} className="hover:text-primary">
                    <a href={item.url} target={item.target}>
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </footer>
      </div>
      
      {/* 不蒜子统计脚本 */}
      <Script
        src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"
        strategy="afterInteractive"
      />
    </section>
  );
}
