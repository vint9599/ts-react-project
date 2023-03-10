import React from "react";
import { users } from "../feed/followFeed";
import user8 from "../assets/user8.jpg";

import { User } from "../types/user";
import { Skeleton } from "@mui/material";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import useApi from "../hooks/useApi";
import { getFollowerUser, getFollowingUser } from "../api/follow";
import { ApiPaginationResult } from "../api/type";

interface FollowStatus {
  [status: string]: boolean;
}
interface Tab {
  [status: string]: number;
}

interface StatusText {
  [statusString: string]: string;
}

const TAB_TYPE: Tab = {
  FOLLOWERS: 0,
  FOLLOWING: 1,
};

const TAP_TYPE_TEXT: StatusText = {
  [TAB_TYPE.FOLLOWERS]: "Followers",
  [TAB_TYPE.FOLLOWING]: "Following",
};

const FOLLOW_STATUS: FollowStatus = {
  FOLLOW: true,
  NOT_FOLLOW: false,
};

const Follower = () => {
  const [user, setUser] = React.useState<User[]>([]);

  const [tabIndex, setTabIndex] = React.useState<number>(0);
  const [page, setPage] = React.useState<number>(1);
  const [pageSize] = React.useState<number>(20);
  const [hasMore, setHasMore] = React.useState<boolean>(false);
  const [firstFetchData, setFirstFetchData] = React.useState<boolean>(true);
  const [isFetching, setIsFetching] = React.useState<boolean>(false);

  let lastUser = React.useRef();
  const { isVisible: isVisibleLastUser, handleObserveRef } = useInfiniteScroll(
    lastUser,
    isFetching
  );

  async function fetchData(
    tabIndex: number,
    way: "reset" | "append" = "reset",
    onSuccess?: () => void
  ) {
    const fetchApi =
      tabIndex === TAB_TYPE.FOLLOWERS ? getFollowerUser : getFollowingUser;

    const response = await fetchApi(page, pageSize);

    if (response !== undefined) {
      const { data: user, page, totalPages } = response;
      setHasMore(totalPages > page);

      if (Array.isArray(user) && user.length > 0) {
        setUser((prev) => {
          if (way === "reset") {
            return user;
          } else {
            return prev.concat(user);
          }
        });
      }

      onSuccess && onSuccess();
    }
    setIsFetching(false);
  }

  const appendFakeData = () => {
    if (Array.isArray(user) && user.length > 0) {
      const partialUser = user.slice(0, pageSize);

      setUser((prev) => prev.concat(...partialUser));
      setTimeout(() => {
        setIsFetching(false);
      }, 500);
    }
  };

  const handleTabChange = (tabIndex: number): void => {
    setUser([]);
    setPage(1);
    setFirstFetchData(true);

    setIsFetching(true);
    if (hasMore) {
      fetchData(tabIndex, "reset", () => setFirstFetchData(false));
    } else {
      appendFakeData();
    }
  };

  React.useEffect(() => {
    if (firstFetchData && !isFetching) {
      setIsFetching(true);
      fetchData(tabIndex, "reset", () => setFirstFetchData(false));
    }
  }, [firstFetchData, isFetching]);

  React.useEffect(() => {
    if (isVisibleLastUser) {
      const nextPage = page + 1;

      setIsFetching(true);
      if (hasMore) {
        setPage(nextPage);
        fetchData(tabIndex, "append", () => setIsFetching(false));
      } else {
        appendFakeData();
      }
    }
  }, [isVisibleLastUser]);

  const makeFollowHtml = (data: User[]): JSX.Element[] => {
    return data.map((follower, index) => {
      const { id, isFollowing, name, username } = follower;

      let imgSrc = "";
      // avatar image url isn't available, use static file instead

      if (users.length > index) {
        imgSrc = users[index]?.pic ?? "";
      } else {
        imgSrc = user8;
      }

      // handle last tag ref for infinite scroll
      let userRef = null;
      if (data.length === index + 1) {
        userRef = handleObserveRef;
      }

      return (
        <React.Fragment key={`${id}_${index}`}>
          <div ref={userRef} className="flex items-center justify-between px-4">
            <div className="my-2 mr-[2px] inline-flex w-full items-center">
              <img
                src={imgSrc}
                alt={`user_${name}`}
                className="mr-[15px] h-10 w-10 rounded-[5px]"
              />
              <div className="flex flex-col">
                <span className="text-[1rem] tracking-[.15px] text-white">
                  {name}
                </span>
                <span className="text-[14px] tracking-[.15px] text-white text-opacity-50">
                  {`@${username}`}
                </span>
              </div>
            </div>

            <button
              className={`${
                isFollowing === FOLLOW_STATUS.FOLLOW
                  ? "contained-btn font-semibold tracking-[.15px]"
                  : "outline-btn"
              } my-[0.5px] h-[29px] rounded-full px-[10.75px] font-button`}
            >
              {isFollowing === FOLLOW_STATUS.FOLLOW ? "Following" : "Follow"}
            </button>
          </div>
        </React.Fragment>
      );
    });
  };

  const ProfileTabs: JSX.Element[] = Object.entries(TAB_TYPE).map(
    ([, value], index) => {
      return (
        <div
          key={index}
          className="relative mx-[1px] h-[67px] w-1/2 cursor-pointer"
        >
          <div
            className={`flex h-full items-end justify-center pb-2.5 text-[16px]  ${
              value === TAB_TYPE.FOLLOWERS
                ? "tracking-[.6px]"
                : "tracking-[.15px]"
            }  ${tabIndex === value ? "text-white" : "text-appTextGrey"}`}
            onClick={() => {
              if (index !== tabIndex) {
                setTabIndex(index);
                setPage(1);
                handleTabChange(index);
              }
            }}
          >
            <span className=""> {TAP_TYPE_TEXT[value]}</span>
          </div>

          <div
            className={`absolute top-[63px] h-[2px] w-full transition-colors ${
              tabIndex === value
                ? "left-0 bg-white font-bold"
                : "left-50 bg-appBorderGrey"
            }`}
          ></div>
        </div>
      );
    }
  );

  const skeleton = React.useMemo(() => {
    return Array.from<number>({ length: pageSize }).map((item, index) => {
      return (
        <div
          key={`skeleton_${index}`}
          className="flex items-center justify-between px-4"
        >
          <div className="my-2 mr-[px] inline-flex w-full items-center">
            <Skeleton
              variant="rounded"
              sx={{
                width: "40px",
                height: "40px",
                marginRight: "15px",
                bgcolor: "grey.900",
              }}
            />
            <div className="flex flex-col">
              <Skeleton
                variant="text"
                sx={{
                  width: "200px",
                  bgcolor: "grey.900",
                  fontSize: "1rem",
                }}
              />

              <Skeleton
                variant="text"
                sx={{
                  width: "200px",
                  bgcolor: "grey.900",
                  fontSize: "1rem",
                }}
              />
            </div>
          </div>
        </div>
      );
    });
  }, []);

  let userList = null;
  if (Array.isArray(user) && user.length > 0) {
    userList = makeFollowHtml(user);
  }

  return (
    <div className="hidden h-full min-w-[375px] max-w-[375px] bg-appDarkGrey desktop:block">
      <div className="-mb-[1.75px] flex h-[67px] pb-6">{ProfileTabs}</div>

      <div
        className="flex max-h-[calc(100vh-67px)]
      flex-col
      overflow-y-scroll"
      >
        {firstFetchData ? skeleton : userList}
        {isFetching ? skeleton : null}
      </div>
    </div>
  );
};

export default Follower;
