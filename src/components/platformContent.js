import PropTypes from "prop-types";
import React from "react";
import { StaticQuery, graphql } from "gatsby";
import { useLocation, useNavigate } from "@reach/router";
import { parse } from "query-string";

import Content from "./content";
import SmartLink from "./smartLink";

const includeQuery = graphql`
  query IncludeQuery {
    allPlatformsYaml(sort: { fields: slug, order: ASC }) {
      nodes {
        name
        slug
      }
    }
    allFile(filter: { sourceInstanceName: { eq: "includes" } }) {
      nodes {
        id
        relativePath
        name
        childMarkdownRemark {
          internal {
            type
          }
          html
        }
        childMdx {
          internal {
            type
          }
          body
        }
      }
    }
  }
`;

const slugMatches = (slug1, slug2) => {
  if (slug1 == "browser") slug1 = "javascript";
  if (slug2 == "browser") slug2 = "javascript";
  return slug1 === slug2;
};

const PlatformContent = ({ includePath }) => {
  const location = useLocation();

  // TODO(dcramer): this isnt working correctly with Gatsby in production
  // on first render it will update _some_ portions of the page, but not all.
  // Specifically it looks like the MDX renderer (or a portion of that) isnt
  // taking in the new content and rendering it appropriately.
  // const platformQueryString = parse(location.search).platform || null;
  const platformQueryString = null;

  const navigate = useNavigate();
  const [dropdown, setDropdown] = React.useState(null);

  return (
    <StaticQuery
      query={includeQuery}
      render={({
        allFile: { nodes: files },
        allPlatformsYaml: { nodes: platforms }
      }) => {
        const matches = files.filter(
          node => node.relativePath.indexOf(includePath) === 0
        );
        const defaultPlatform = platforms.find(p =>
          matches.find(m => slugMatches(m.name, p.slug))
        );

        let activePlatform =
          platforms.find(p => slugMatches(p.slug, platformQueryString)) ||
          defaultPlatform;
        if (!activePlatform) activePlatform = defaultPlatform;
        const contentMatch = matches.find(m =>
          slugMatches(m.name, activePlatform.slug)
        );
        if (!contentMatch) {
          console.warn(
            `Couldn't find content in ${includePath} for selected platform: ${activePlatform.slug}`
          );
        }

        return (
          <div className="platform-specific-content">
            <div className="nav pb-1 flex">
              <div className="dropdown mr-2 mb-1">
                <button
                  className="btn btn-sm btn-secondary dropdown-toggle"
                  onClick={() => setDropdown(!dropdown)}
                >
                  {activePlatform.name}
                </button>

                <div
                  className="nav dropdown-menu"
                  role="tablist"
                  style={{ display: dropdown ? "block" : "none" }}
                >
                  {matches.map(node => {
                    const platform = platforms.find(p =>
                      slugMatches(p.slug, node.name)
                    );
                    return (
                      <a
                        className="dropdown-item"
                        role="tab"
                        key={platform.slug}
                        onClick={() => {
                          setDropdown(false);
                          navigate(
                            `${location.pathname}?platform=${platform.slug}`
                          );
                          // TODO: retain scroll
                          // window.scrollTo(window.scrollX, window.scrollY);
                        }}
                      >
                        {platform.name}
                      </a>
                    );
                  })}
                  <SmartLink className="dropdown-item" to="/platforms/">
                    <em>Platform not listed?</em>
                  </SmartLink>
                </div>
              </div>
            </div>

            <div className="tab-content">
              <div className="tab-pane show active">
                {contentMatch && (
                  <Content key={contentMatch.id} file={contentMatch} />
                )}
              </div>
            </div>
          </div>
        );
      }}
    />
  );
};

PlatformContent.propTypes = {
  includePath: PropTypes.string.isRequired
};

PlatformContent.defaultProps = {};

export default PlatformContent;
