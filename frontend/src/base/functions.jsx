import config from "../config.json";
import { NavLink } from "react-router-dom";


const base_url = config.BaseUrl;

function changeUrlPagination(url, target_url) {
    return url ? url.replace(base_url.replace("https", "http") + target_url, "") : "";
}

function pagination(links, target_url) {
    // console.log(links);
    return (
        <nav aria-label="navigation">
            <ul className="pagination">
                <li className="page-item">
                    <NavLink
                        className={links.previous_url ? "page-link" : "page-link disabled"}
                        to={changeUrlPagination(links.previous_url, target_url)}
                    >
                        Previous
                    </NavLink>
                </li>
                {links.page_links.map(item => (
                    <li className="page-item" key={item[1]}>
                        <NavLink
                            className={(item[2] ? "page-link is_active" : "page-link") + (item[0] ? "" : " disabled")}
                            to={changeUrlPagination(item[0], target_url)}
                        >
                            {item[1] ? item[1] : "..."}
                        </NavLink>
                    </li>
                ))}
                <li className="page-item">
                    <NavLink
                        className={links.next_url ? "page-link" : "page-link disabled"}
                        to={changeUrlPagination(links.next_url, target_url)}
                    >
                        Next
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
}

export default pagination;