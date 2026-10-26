FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 DATA_DIR=/data
WORKDIR /app
COPY requirements.txt /tmp/wedding-source/
RUN pip install --no-cache-dir -r /tmp/wedding-source/requirements.txt \
    && groupadd --gid 10001 wedding \
    && useradd --uid 10001 --gid wedding --no-create-home wedding \
    && install -d -m 0700 -o 10001 -g 10001 /data
COPY app.py schema.sql rsvp-admin.html photo-admin.html /tmp/wedding-source/
# QNAP storage can apply extended ACLs that chmod alone does not remove.
# Clear only POSIX ACLs on these image paths, then install fresh program files
# without carrying source metadata. Never change NAS shares or existing volumes.
RUN python -c "import os; paths=('/app', '/data'); acl=('system.posix_acl_access', 'system.posix_acl_default'); [os.removexattr(p, a) for p in paths for a in os.listxattr(p) if a in acl]" \
    && install -o 10001 -g 10001 -m 0444 /tmp/wedding-source/app.py /tmp/wedding-source/schema.sql /tmp/wedding-source/rsvp-admin.html /tmp/wedding-source/photo-admin.html /tmp/wedding-source/requirements.txt /app/ \
    && python -c "import os; paths=('/app/app.py', '/app/schema.sql', '/app/rsvp-admin.html', '/app/photo-admin.html', '/app/requirements.txt'); acl=('system.posix_acl_access', 'system.posix_acl_default'); [os.removexattr(p, a) for p in paths for a in os.listxattr(p) if a in acl]" \
    && chown 10001:10001 /app /data \
    && chmod 0555 /app \
    && chmod 0444 /app/app.py /app/schema.sql /app/rsvp-admin.html /app/photo-admin.html /app/requirements.txt \
    && chmod 0700 /data \
    && python -c "import os, stat; paths=('/app', '/app/app.py', '/app/schema.sql', '/app/rsvp-admin.html', '/app/photo-admin.html', '/app/requirements.txt', '/data'); [print(p, 'uid/gid', os.stat(p).st_uid, os.stat(p).st_gid, 'mode', oct(stat.S_IMODE(os.stat(p).st_mode)), 'xattr names', os.listxattr(p)) for p in paths]" \
    && rm -f /tmp/wedding-source/app.py /tmp/wedding-source/schema.sql /tmp/wedding-source/rsvp-admin.html /tmp/wedding-source/photo-admin.html /tmp/wedding-source/requirements.txt \
    && rmdir /tmp/wedding-source
USER 10001:10001
# Fail the image build if the runtime user cannot import code or read its schema.
# Do not call create_app() here: that would bake a database into the image.
RUN python -c "import os, tempfile; from pathlib import Path; assert os.geteuid() == 10001; import app; assert callable(app.create_app); Path('/app/schema.sql').read_text(); Path('/app/rsvp-admin.html').read_text(); Path('/app/photo-admin.html').read_text(); probe = tempfile.NamedTemporaryFile(dir='/data'); probe.write(b'build permission check'); probe.flush(); probe.close(); print('Image permissions verified for UID 10001')"
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)"
CMD ["gunicorn", "--bind=0.0.0.0:8000", "--workers=1", "--threads=4", "--timeout=120", "--worker-tmp-dir=/tmp", "--max-requests=1000", "--max-requests-jitter=100", "app:create_app()"]
